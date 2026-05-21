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
      pageCount: 6, // pagecount that makes notify-c5 ineligible and notify-c4 eligible based on their pack configs
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLog(
      "Pack specification filtered out based on constraints",
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

  const supplierCapacityTestCases = [
    {
      testCase: "Verify if suppliers without capacity are filtered out",
      letterVariantId: 4,
      expectedSupplierId: "supplier2",
    },
    {
      testCase:
        "Verify that fallback is triggered when a suppliers are at daily capacity, ignoring capacity",
      letterVariantId: 3,
      expectedSupplierId: "supplier1",
    },
  ];

  for (const {
    expectedSupplierId,
    letterVariantId,
    testCase,
  } of supplierCapacityTestCases) {
    test(testCase, async () => {
      const letterVariant = getVariantsForAllocation(letterVariantId);
      const domainId = randomUUID();
      const dailyAllocatedCapacity = 500_000;
      const allocationDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/London",
      }).format(new Date());

      const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb(
        {
          supplier3: 0,
          supplier4: 0,
        },
        allocationDate,
      );
      logger.info(
        `Daily allocation before test execution ${JSON.stringify(dailyAllocation.allocations)}`,
      );

      const originalSupplier3Allocation =
        dailyAllocation.allocations.supplier3 ?? 0;

      // set supplier3 to exactly daily capacity so allocator filters it out
      if (dailyAllocation.allocations.supplier3 !== dailyAllocatedCapacity) {
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

      const exceededCapacityLog =
        await getExceededDailyCapacityLog("supplier3");
      expect(exceededCapacityLog.description).toBe(
        "Supplier has exceeded daily capacity",
      );

      const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
      const supplierDetails =
        supplierAllocatorLog.msg?.allocationDetails?.supplierSpec;
      expect(supplierDetails?.supplierId).toBe(expectedSupplierId);

      const lettersInDb = await getLettersFromSupplierTable(
        expectedSupplierId,
        domainId,
        "PENDING",
      );
      expect(lettersInDb.status).toBe("PENDING");
      expect(lettersInDb.specificationId).toBe(
        supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.specId,
      );

      if (testCase.includes("fallback")) {
        const fallbackDailyAllocation =
          await getOrSeedLetterDailyAllocationFromDb({
            supplier1: 0,
          });
        expect(fallbackDailyAllocation.allocations.supplier1).toBe(
          dailyAllocatedCapacity + 1,
        );
      }

      await updateSupplierDailyAllocation(
        "supplier3",
        originalSupplier3Allocation,
        allocationDate,
      );
    });
  }
});
