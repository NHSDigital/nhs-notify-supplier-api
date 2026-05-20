import { expect, test } from "@playwright/test";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { randomUUID } from "node:crypto";
import { logger } from "tests/helpers/pino-logger";
import {
  getAllocationLogForDomainId,
  getVariantsForAllocation,
} from "tests/helpers/allocation-helper";

test.describe("Allocator Lambda Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test(`Verify that allocator successfully allocates a letter and emits PENDING event`, async () => {
    const domainId = randomUUID();
    logger.info(`Testing event subscription with domainId: ${domainId}`);

    const letterVariant = getVariantsForAllocation(1);
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
    });

    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
    const supplierId =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;
    const specId =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.specId;
    const billingId =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.billingId;
    const allocationStatus =
      supplierAllocatorLog.msg?.allocationDetails?.allocationStatus?.status;

    if (!supplierId) {
      throw new Error("supplierId was not found in supplier allocator log");
    }

    expect(specId).toBeTruthy();
    expect(billingId).toBeTruthy();
    expect(allocationStatus).toBe("PENDING");
  });

  test("Verify that unknown letter variant is marked as rejected allocation", async () => {
    const domainId = randomUUID();
    logger.info(`Testing rejected allocation with domainId: ${domainId}`);

    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: `unknown-variant-${domainId}`,
    });

    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
    const supplierId =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;
    const allocationStatus =
      supplierAllocatorLog.msg?.allocationDetails?.allocationStatus?.status;
    const reasonCode =
      supplierAllocatorLog.msg?.allocationDetails?.allocationStatus?.reasonCode;

    expect(supplierId).toBe("unknown");
    expect(allocationStatus).toBe("REJECTED");
    expect(reasonCode).toBe("NO_SUPPLIERS_AVAILABLE");
  });

  test("Verify that first eligible supplier is selected", async () => {
    const letterVariant = getVariantsForAllocation(1);
    const domainId = randomUUID();

    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
      pageCount: 6, // pagecount that makes supplier1 ineligible and supplier2 eligible based on our config
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
    const supplierId =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;

    expect(supplierId).toBe("supplier2");
  });
});
