import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  SupplierFactorLog,
  getAllocationLog,
  getAllocationLogForDomainId,
  getOrSeedLetterDailyAllocationFromDb,
  getOrSeedOverallAllocationFromDb,
  getOverallAllocationFromDb,
  getVariantsForAllocation,
  updateSupplierDailyAllocation,
  updateSupplierOverallAllocation,
} from "tests/helpers/allocation-helper";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import {
  buildWeightingSnapshot,
  getLowestWeightingSupplier,
} from "tests/helpers/allocation-factor-helper";
import { logger } from "tests/helpers/pino-logger";

test.describe("Allocator Weighting Tests", () => {
  test.setTimeout(180_000);

  test("Verify weighting and lowest weighting supplier selection for multiple suppliers", async () => {
    const testStartedAt = Date.now();
    const domainId = randomUUID();
    const letterVariant = getVariantsForAllocation(2);
    const volumeGroupId = "volumeGroup-test3";
    const targetPercentages = {
      supplier1: 50,
      supplier2: 50,
    };

    const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb({
      supplier1: 0,
      supplier2: 0,
    });
    const overallAllocation = await getOrSeedOverallAllocationFromDb(
      {
        supplier1: 0,
        supplier2: 0,
      },
      volumeGroupId,
    );

    const originalDailySupplier1 = dailyAllocation.allocations.supplier1 ?? 0;
    const originalDailySupplier2 = dailyAllocation.allocations.supplier2 ?? 0;
    const originalOverallSupplier1 =
      overallAllocation.allocations.supplier1 ?? 0;
    const originalOverallSupplier2 =
      overallAllocation.allocations.supplier2 ?? 0;

    const seededOverall = {
      supplier1: 900,
      supplier2: 100,
    };

    try {
      await updateSupplierDailyAllocation("supplier1", 0);
      await updateSupplierDailyAllocation("supplier2", 0);
      await updateSupplierOverallAllocation(
        "supplier1",
        seededOverall.supplier1,
        volumeGroupId,
      );
      await updateSupplierOverallAllocation(
        "supplier2",
        seededOverall.supplier2,
        volumeGroupId,
      );

      const weightingSnapshot = buildWeightingSnapshot(
        seededOverall,
        targetPercentages,
      );
      const lowestWeightingSupplier =
        getLowestWeightingSupplier(weightingSnapshot);

      expect(weightingSnapshot.supplier1.allocatedVolume).toBe(900);
      expect(weightingSnapshot.supplier2.allocatedVolume).toBe(100);
      expect(weightingSnapshot.supplier1.allocatedPercentage).toBe(90);
      expect(weightingSnapshot.supplier2.allocatedPercentage).toBe(10);
      expect(lowestWeightingSupplier).toBe("supplier2");

      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
      });
      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();

      console.log(`testStartedAt: ${testStartedAt}`);
      const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
      const supplierFactorLog = await getAllocationLog<SupplierFactorLog>(
        "Calculated supplier factors for allocation",
        {
          startTimeMs: testStartedAt,
        },
      );

      const selectedSupplierId =
        supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;

      expect(selectedSupplierId).toBe(lowestWeightingSupplier);
      expect(weightingSnapshot.supplier1.weighting).toBe(
        supplierFactorLog.supplierFactors?.find(
          (factor) => factor.supplierId === "supplier1",
        )?.factor,
      );
      expect(weightingSnapshot.supplier2.weighting).toBe(
        supplierFactorLog.supplierFactors?.find(
          (factor) => factor.supplierId === "supplier2",
        )?.factor,
      );

      const updatedOverallAllocation =
        await getOverallAllocationFromDb(volumeGroupId);
      expect(updatedOverallAllocation.allocations.supplier1).toBe(900);
      expect(updatedOverallAllocation.allocations.supplier2).toBe(101);
      expect(supplierFactorLog.description).toBe(
        "Calculated supplier factors for allocation",
      );
    } finally {
      await updateSupplierDailyAllocation("supplier1", originalDailySupplier1);
      await updateSupplierDailyAllocation("supplier2", originalDailySupplier2);
      await updateSupplierOverallAllocation(
        "supplier1",
        originalOverallSupplier1,
        volumeGroupId,
      );
      await updateSupplierOverallAllocation(
        "supplier2",
        originalOverallSupplier2,
        volumeGroupId,
      );
    }
  });

  test("Verify lowest weighting supplier selection with valid unequal target percentages", async () => {
    const testStartedAt = Date.now();
    const domainId = randomUUID();
    const letterVariant = getVariantsForAllocation(1);
    const volumeGroupId = "volumeGroup-test1";
    const targetPercentages = {
      supplier1: 30,
      supplier2: 70,
    };

    const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb({
      supplier1: 0,
      supplier2: 0,
    });
    const overallAllocation = await getOrSeedOverallAllocationFromDb(
      {
        supplier1: 0,
        supplier2: 0,
      },
      volumeGroupId,
    );

    const originalDailySupplier1 = dailyAllocation.allocations.supplier1 ?? 0;
    const originalDailySupplier2 = dailyAllocation.allocations.supplier2 ?? 0;
    const originalOverallSupplier1 =
      overallAllocation.allocations.supplier1 ?? 0;
    const originalOverallSupplier2 =
      overallAllocation.allocations.supplier2 ?? 0;

    const seededOverall = {
      supplier1: 600,
      supplier2: 400,
    };

    try {
      await updateSupplierDailyAllocation("supplier1", 0);
      await updateSupplierDailyAllocation("supplier2", 0);
      await updateSupplierOverallAllocation(
        "supplier1",
        seededOverall.supplier1,
        volumeGroupId,
      );
      await updateSupplierOverallAllocation(
        "supplier2",
        seededOverall.supplier2,
        volumeGroupId,
      );

      const weightingSnapshot = buildWeightingSnapshot(
        seededOverall,
        targetPercentages,
      );
      const lowestWeightingSupplier =
        getLowestWeightingSupplier(weightingSnapshot);

      expect(weightingSnapshot.supplier1.allocatedVolume).toBe(600);
      expect(weightingSnapshot.supplier2.allocatedVolume).toBe(400);
      expect(weightingSnapshot.supplier1.allocatedPercentage).toBe(60);
      expect(weightingSnapshot.supplier2.allocatedPercentage).toBe(40);
      expect(weightingSnapshot.supplier1.targetPercentage).toBe(30);
      expect(weightingSnapshot.supplier2.targetPercentage).toBe(70);
      expect(weightingSnapshot.supplier1.weighting).toBe(2);
      expect(weightingSnapshot.supplier2.weighting).toBeCloseTo(4 / 7, 10);
      expect(lowestWeightingSupplier).toBe("supplier2");
      expect(Object.keys(weightingSnapshot)).toEqual(
        expect.arrayContaining(["supplier1", "supplier2"]),
      );

      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
      });
      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();

      const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
      const supplierFactorLog = await getAllocationLog<SupplierFactorLog>(
        "Calculated supplier factors for allocation",
        {
          startTimeMs: testStartedAt,
        },
      );

      const selectedSupplierId =
        supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;

      expect(selectedSupplierId).toBe(lowestWeightingSupplier);
      logger.info(
        `Weighting snapshot: ${JSON.stringify(weightingSnapshot)}, Supplier factors from log: ${JSON.stringify(
          supplierFactorLog.supplierFactors,
        )}`,
      );
      expect(weightingSnapshot.supplier1.weighting).toBe(
        supplierFactorLog.supplierFactors?.find(
          (factor) => factor.supplierId === "supplier1",
        )?.factor,
      );
      expect(weightingSnapshot.supplier2.weighting).toBe(
        supplierFactorLog.supplierFactors?.find(
          (factor) => factor.supplierId === "supplier2",
        )?.factor,
      );

      const updatedOverallAllocation =
        await getOverallAllocationFromDb(volumeGroupId);
      expect(updatedOverallAllocation.allocations.supplier1).toBe(600);
      expect(updatedOverallAllocation.allocations.supplier2).toBe(401);
    } finally {
      await updateSupplierDailyAllocation("supplier1", originalDailySupplier1);
      await updateSupplierDailyAllocation("supplier2", originalDailySupplier2);
      await updateSupplierOverallAllocation(
        "supplier1",
        originalOverallSupplier1,
        volumeGroupId,
      );
      await updateSupplierOverallAllocation(
        "supplier2",
        originalOverallSupplier2,
        volumeGroupId,
      );
    }
  });
});
