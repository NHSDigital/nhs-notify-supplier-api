import { randomUUID } from "node:crypto";
import test, { expect } from "playwright/test";
import {
  PackErrorLog,
  getAllocationLog,
  getAllocationLogForDomainId,
  getVariantsForAllocation,
} from "tests/helpers/allocation-helper";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { getLettersFromSupplierTable } from "tests/helpers/generate-fetch-test-data";
import { logger } from "tests/helpers/pino-logger";
import { sendSnsEvent } from "tests/helpers/send-sns-event";

test.describe("Allocator Rejected Allocation Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling
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

    const lettersInDb = await getLettersFromSupplierTable(
      supplierId!,
      domainId,
      "REJECTED",
    );
    expect(lettersInDb).toBeTruthy();
    expect(lettersInDb.status).toBe(allocationStatus);
    expect(lettersInDb.reasonCode).toBe(reasonCode);
    expect(lettersInDb.reasonText).toBe(
      `No letter variant details found for id unknown-variant-${domainId}`,
    );
  });

  test("Verify that the letters are REJECTED when no pack specification is eligible", async () => {
    const letterVariant = getVariantsForAllocation(1);
    const domainId = `NoEligiblePackSpecs-${randomUUID()}`;
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
      pageCount: 100, // high page count to ensure pack specifications are filtered out based on constraints
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLog<PackErrorLog>(
      "No eligible pack specifications found for letter",
    );

    const { packSpecificationIds } = supplierAllocatorLog;
    expect(packSpecificationIds).toBeTruthy();
    expect(supplierAllocatorLog.letterVariantId).toBe(letterVariant);

    const allocationLog = await getAllocationLogForDomainId(domainId);
    const lettersInDb = await getLettersFromSupplierTable(
      "unknown",
      domainId,
      "REJECTED",
    );

    expect(lettersInDb.status).toBe("REJECTED");
    expect(lettersInDb.supplierId).toBe(
      allocationLog.msg?.allocationDetails?.supplierSpec?.supplierId,
    );
    expect(lettersInDb.reasonText).toBe(
      `No eligible pack specifications found for letter variant id ${letterVariant} and pack specification ids ${packSpecificationIds?.join(", ")}`,
    );
  });
});
