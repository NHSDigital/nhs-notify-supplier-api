import { expect, test } from "@playwright/test";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { randomUUID } from "node:crypto";
import { logger } from "tests/helpers/pino-logger";
import {
  getAllocationLogForDomainId,
  getAllocationPackSpecLog,
  getLetterDailyAllocationFromDb,
  getLetterVariantConfigFromDb,
  getVariantsForAllocation,
  updateSupplierDailyAllocation,
} from "tests/helpers/allocation-helper";

test.describe("Allocator Lambda Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  /* test(`Verify that allocator successfully allocates a letter and emits PENDING event`, async () => {
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

    const letterVariantConfig =
      await getLetterVariantConfigFromDb(letterVariant);
    expect(letterVariantConfig.packSpecificationIds).toEqual(
      expect.arrayContaining(["notify-c4", "notify-c5"]),
    );

    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
      pageCount: 6, // pagecount that makes notify-c5 ineligible and notify-c4 eligible based on their pack configs
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationPackSpecLog(
      "Pack specification filtered out based on constraints",
    );
    const filteredPackSpecId = supplierAllocatorLog.packSpecId;
    logger.info(`Pack spec filtered out ${filteredPackSpecId}`);
    expect(filteredPackSpecId).toBe("notify-c5");
    expect(letterVariantConfig.packSpecificationIds).toContain(
      filteredPackSpecId as string,
    );

    const allocationLog = await getAllocationLogForDomainId(domainId);
    const allocatedPackSpecId =
      allocationLog.msg?.allocationDetails?.supplierSpec?.specId;
    expect(allocatedPackSpecId).toBeTruthy();
    expect(letterVariantConfig.packSpecificationIds).toContain(
      allocatedPackSpecId as string,
    );
    expect(allocatedPackSpecId).toBe("notify-c4");
  });
*/
  test("Verify if suppliers without capacity are filtered out", async () => {
    const letterVariant = getVariantsForAllocation(2);
    const domainId = randomUUID();

    const letterVariantConfig =
      await getLetterVariantConfigFromDb(letterVariant);

    const dailyAllocation = await getLetterDailyAllocationFromDb();
    logger.info(
      `Daily allocation before test execution ${JSON.stringify(dailyAllocation.allocations)}`,
    );
    const originalSupplier1Allocation = dailyAllocation.allocations.supplier1;

    // update one supplier's allocated daily capacity to max so it gets filtered out
    if (dailyAllocation.allocations.supplier1 != 500_000) {
      await updateSupplierDailyAllocation("supplier1", 500_000);
    }

    try {
      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
      });

      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();
    } finally {
      await updateSupplierDailyAllocation(
        "supplier1",
        originalSupplier1Allocation,
      );
    }
    const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
    const supplierDetails =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec;
    expect(supplierDetails?.supplierId).toBe("supplier2");
    expect(
      supplierAllocatorLog.msg?.allocationDetails?.allocationStatus?.status,
    ).toBe("PENDING");
  });
});
