import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  SupplierFactorLog,
  getAllocationLog,
  getAllocationLogForDomainId,
  getLetterVariantConfigFromDb,
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

test.describe("Allocator Weighting Tests", () => {
  test.setTimeout(180_000);

  test("Verify weighting and lowest weighting supplier selection for multiple suppliers", async () => {
    const testStartedAt = Date.now();
    const domainId = randomUUID();
    const letterVariant = getVariantsForAllocation(4);
    const letterVariantConfig =
      await getLetterVariantConfigFromDb(letterVariant);
    const volGroupId = letterVariantConfig.volumeGroupId;
    const targetPercentages = {
      supplier3: 50,
      supplier4: 50,
    };

    const dailyAllocation = await getOrSeedLetterDailyAllocationFromDb({
      supplier3: 0,
      supplier4: 0,
    });
    const overallAllocation = await getOrSeedOverallAllocationFromDb(
      {
        supplier3: 0,
        supplier4: 0,
      },
      volGroupId,
    );

    const originalDailySupplier3 = dailyAllocation.allocations.supplier3 ?? 0;
    const originalDailySupplier4 = dailyAllocation.allocations.supplier4 ?? 0;
    const originalOverallSupplier3 =
      overallAllocation.allocations.supplier3 ?? 0;
    const originalOverallSupplier4 =
      overallAllocation.allocations.supplier4 ?? 0;

    const seededOverall = {
      supplier3: 900,
      supplier4: 100,
    };

    try {
      await updateSupplierDailyAllocation("supplier3", 0);
      await updateSupplierDailyAllocation("supplier4", 0);
      await updateSupplierOverallAllocation(
        "supplier3",
        seededOverall.supplier3,
        volGroupId,
      );
      await updateSupplierOverallAllocation(
        "supplier4",
        seededOverall.supplier4,
        volGroupId,
      );

      const weightingSnapshot = buildWeightingSnapshot(
        seededOverall,
        targetPercentages,
      );
      const lowestWeightingSupplier =
        getLowestWeightingSupplier(weightingSnapshot);

      expect(weightingSnapshot.supplier3.allocatedVolume).toBe(900);
      expect(weightingSnapshot.supplier4.allocatedVolume).toBe(100);
      expect(weightingSnapshot.supplier3.allocatedPercentage).toBe(90);
      expect(weightingSnapshot.supplier4.allocatedPercentage).toBe(10);
      expect(lowestWeightingSupplier).toBe("supplier4");

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
          extraPatterns: [domainId],
        },
      );

      const selectedSupplierId =
        supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;

      expect(selectedSupplierId).toBe(lowestWeightingSupplier);
      expect(weightingSnapshot.supplier3.weighting).toBe(
        supplierFactorLog.supplierFactors?.find(
          (factor) => factor.supplierId === "supplier3",
        )?.factor,
      );
      expect(weightingSnapshot.supplier4.weighting).toBe(
        supplierFactorLog.supplierFactors?.find(
          (factor) => factor.supplierId === "supplier4",
        )?.factor,
      );

      const updatedOverallAllocation =
        await getOverallAllocationFromDb(volGroupId);
      expect(updatedOverallAllocation.allocations.supplier3).toBe(900);
      expect(updatedOverallAllocation.allocations.supplier4).toBe(101);
      expect(supplierFactorLog.description).toBe(
        "Calculated supplier factors for allocation",
      );
    } finally {
      await updateSupplierDailyAllocation("supplier3", originalDailySupplier3);
      await updateSupplierDailyAllocation("supplier4", originalDailySupplier4);
      await updateSupplierOverallAllocation(
        "supplier3",
        originalOverallSupplier3,
        volGroupId,
      );
      await updateSupplierOverallAllocation(
        "supplier4",
        originalOverallSupplier4,
        volGroupId,
      );
    }
  });
});
