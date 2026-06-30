import { expect, test } from "@playwright/test";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { randomUUID } from "node:crypto";
import { logger } from "tests/helpers/pino-logger";
import {
  getAllocationLog,
  getAllocationLogForDomainId,
  getExceededDailyCapacityLog,
  getLetterVariantConfigFromDb,
  getOrSeedLetterDailyAllocationFromDb,
  getVariantsForAllocation,
  updateSupplierDailyAllocation,
} from "tests/helpers/allocation-helper";
import { getLettersFromSupplierTable } from "tests/helpers/generate-fetch-test-data";

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
    const lettersInDb = await getLettersFromSupplierTable(
      supplierId!,
      domainId,
      "PENDING",
    );
    const allocationStatus =
      supplierAllocatorLog.msg?.allocationDetails?.allocationStatus?.status;
    expect(lettersInDb).toBeTruthy();
    expect(lettersInDb.status).toBe(allocationStatus);
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
      pageCount: 11, // pagecount that makes notify-c5 ineligible and notify-c4 eligible based on their pack configs (note packs are duplex)
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLog(
      "Pack specification filtered out based on pageCount constraints",
      { extraPatterns: [domainId] },
    );
    const filteredPackSpecId = supplierAllocatorLog.packSpecId;
    logger.info(`Pack spec filtered out ${filteredPackSpecId}`);
    expect(filteredPackSpecId).toBe("notify-c5");
    expect(letterVariantConfig.packSpecificationIds).toContain(
      filteredPackSpecId as string,
    );

    const allocationLog = await getAllocationLogForDomainId(domainId);
    const lettersInDb = await getLettersFromSupplierTable(
      allocationLog.msg?.allocationDetails?.supplierSpec?.supplierId!,
      domainId,
      "PENDING",
    );
    expect(lettersInDb.status).toBe("PENDING");
    const allocatedPackSpecId =
      allocationLog.msg?.allocationDetails?.supplierSpec?.specId;
    expect(allocatedPackSpecId).toBe("notify-c4");
    expect(lettersInDb.specificationId).toBe(allocatedPackSpecId);
  });

  test("Verify if suppliers without capacity are filtered out", async () => {
    const letterVariant = getVariantsForAllocation(4);
    const domainId = `supcapacity-4-${randomUUID()}`;
    const dailyAllocatedCapacity = 500_000;
    const allocationDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
    }).format(new Date());

    const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb(
      {
        supplier1: 0,
        supplier2: 0,
      },
      allocationDate,
    );
    logger.info(
      `Daily allocation before test execution ${JSON.stringify(dailyAllocation.allocations)}`,
    );
    const originalSupplier1Allocation =
      dailyAllocation.allocations.supplier3 ?? 0;

    // set supplier1 to exactly daily capacity so allocator filters it out
    if (dailyAllocation.allocations.supplier1 !== dailyAllocatedCapacity) {
      await updateSupplierDailyAllocation(
        "supplier3",
        dailyAllocatedCapacity,
        allocationDate,
      );
    }
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const exceededCapacityLog = await getExceededDailyCapacityLog("supplier3");
    expect(exceededCapacityLog.description).toBe(
      "Supplier has exceeded daily capacity",
    );

    const lettersInDb = await getLettersFromSupplierTable(
      "supplier4",
      domainId,
      "PENDING",
    );
    expect(lettersInDb.status).toBe("PENDING");
    expect(lettersInDb.supplierId).toBe("supplier4");

    await updateSupplierDailyAllocation(
      "supplier3",
      originalSupplier1Allocation,
      allocationDate,
    );
  });

  test("Verify that fallback is triggered when a suppliers are at daily capacity, ignoring capacity", async () => {
    const letterVariant = getVariantsForAllocation(5);
    const domainId = `supcapacity-5-${randomUUID()}`;
    const dailyAllocatedCapacity = 500_000;
    const allocationDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
    }).format(new Date());

    const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb(
      {
        supplier5: 0,
      },
      allocationDate,
    );
    logger.info(
      `Daily allocation before test execution ${JSON.stringify(dailyAllocation.allocations)}`,
    );

    const originalSupplierAllocation =
      dailyAllocation.allocations.supplier5 ?? 0;

    // set supplier1 to exactly daily capacity so allocator filters it out
    if (dailyAllocation.allocations.supplier1 !== dailyAllocatedCapacity) {
      await updateSupplierDailyAllocation(
        "supplier5",
        dailyAllocatedCapacity,
        allocationDate,
      );
    }
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const exceededCapacityLog = await getExceededDailyCapacityLog("supplier5");
    expect(exceededCapacityLog.description).toBe(
      "Supplier has exceeded daily capacity",
    );

    const lettersInDb = await getLettersFromSupplierTable(
      "supplier5",
      domainId,
      "PENDING",
    );
    expect(lettersInDb.status).toBe("PENDING");
    const fallbackDailyAllocation = await getOrSeedLetterDailyAllocationFromDb({
      supplier5: 0,
    });
    expect(fallbackDailyAllocation.allocations.supplier5).toBeGreaterThan(
      dailyAllocatedCapacity,
    );

    await updateSupplierDailyAllocation(
      "supplier5",
      originalSupplierAllocation,
      allocationDate,
    );
  });
});
