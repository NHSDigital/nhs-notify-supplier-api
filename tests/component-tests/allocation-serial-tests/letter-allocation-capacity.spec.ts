import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { logger } from "tests/helpers/pino-logger";
import {
  adjustSupplierDailyAllocation,
  getAllocationDate,
  getExceededDailyCapacityLog,
  getLetterDailyAllocationFromDb,
  getOrSeedLetterDailyAllocationFromDb,
  getVariantsForAllocation,
  updateSupplierDailyAllocation,
} from "tests/helpers/allocation-helper";
import { getLettersFromSupplierTable } from "tests/helpers/generate-fetch-test-data";

const DAILY_ALLOCATED_CAPACITY = 500_000;

test.describe("Allocator Daily Capacity Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test("Verify if suppliers without capacity are filtered out", async () => {
    const letterVariant = getVariantsForAllocation(4);
    const domainId = `supcapacity-4-${randomUUID()}`;
    const allocationDate = getAllocationDate();

    const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb(
      { supplier3: 0, supplier4: 0 },
      allocationDate,
    );
    logger.info(
      `Daily allocation before test execution ${JSON.stringify(dailyAllocation.allocations)}`,
    );
    const originalSupplier3Allocation =
      dailyAllocation.allocations.supplier3 ?? 0;

    // put supplier3 at daily capacity so the allocator filters it out
    await updateSupplierDailyAllocation(
      "supplier3",
      DAILY_ALLOCATED_CAPACITY,
      allocationDate,
    );
    try {
      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
      });

      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();

      const exceededCapacityLog =
        await getExceededDailyCapacityLog("supplier3");
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
    } finally {
      await adjustSupplierDailyAllocation(
        "supplier3",
        originalSupplier3Allocation - DAILY_ALLOCATED_CAPACITY,
        allocationDate,
      );
    }
  });

  test("Verify that fallback is triggered when a suppliers are at daily capacity, ignoring capacity", async () => {
    const letterVariant = getVariantsForAllocation(5);
    const domainId = `supcapacity-5-${randomUUID()}`;
    const allocationDate = getAllocationDate();

    const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb(
      { supplier5: 0 },
      allocationDate,
    );
    logger.info(
      `Daily allocation before test execution ${JSON.stringify(dailyAllocation.allocations)}`,
    );
    const originalSupplier5Allocation =
      dailyAllocation.allocations.supplier5 ?? 0;

    // put supplier5 (the only supplier for this variant) at daily capacity to force the fallback
    await updateSupplierDailyAllocation(
      "supplier5",
      DAILY_ALLOCATED_CAPACITY,
      allocationDate,
    );
    try {
      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
      });

      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();

      const exceededCapacityLog =
        await getExceededDailyCapacityLog("supplier5");
      expect(exceededCapacityLog.description).toBe(
        "Supplier has exceeded daily capacity",
      );

      const lettersInDb = await getLettersFromSupplierTable(
        "supplier5",
        domainId,
        "PENDING",
      );
      expect(lettersInDb.status).toBe("PENDING");

      const fallbackDailyAllocation =
        await getLetterDailyAllocationFromDb(allocationDate);
      expect(fallbackDailyAllocation.allocations.supplier5).toBeGreaterThan(
        DAILY_ALLOCATED_CAPACITY,
      );
    } finally {
      await adjustSupplierDailyAllocation(
        "supplier5",
        originalSupplier5Allocation - DAILY_ALLOCATED_CAPACITY,
        allocationDate,
      );
    }
  });
});
