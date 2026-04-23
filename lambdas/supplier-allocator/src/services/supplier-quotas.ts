import { DailyAllocation, OverallAllocation } from "@internal/datastore";
import { SupplierAllocation } from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { Deps } from "../config/deps";

export async function calculateSupplierAllocatedFactor(
  supplierAllocations: SupplierAllocation[],
  deps: Deps,
): Promise<{ supplierId: string; factor: number }[]> {
  const volumeGroupId = supplierAllocations[0].volumeGroup; // Assuming all allocations are for the same volume group
  const overallAllocation =
    await deps.supplierQuotasRepo.getOverallAllocation(volumeGroupId);

  if (!overallAllocation) {
    return supplierAllocations.map((allocation) => ({
      supplierId: allocation.supplier,
      factor: 0,
    }));
  }

  const { allocations } = overallAllocation;

  const totalAllocation = Object.values(allocations).reduce(
    (sum, allocation) => sum + allocation,
    0,
  );

  return supplierAllocations.map((allocation) => {
    const supplierAllocation = allocations[allocation.supplier] ?? 0;
    const percentage =
      totalAllocation > 0 ? (supplierAllocation / totalAllocation) * 100 : 0;
    const factor = percentage / allocation.allocationPercentage;
    return { supplierId: allocation.supplier, factor };
  });
}

// function to either update or create a new overall allocation and daily allocation for a given supplier, volume group and allocation amount
// if the overall allocation for the volume group does not exist, it will be created with the new allocation for the supplier and 0 for the other suppliers

export async function updateSupplierAllocation(
  volumeGroupId: string,
  supplierId: string,
  newAllocation: number,
  deps: Deps,
): Promise<void> {
  const overallAllocation =
    await deps.supplierQuotasRepo.getOverallAllocation(volumeGroupId);
  if (overallAllocation) {
    deps.logger.info({
      description: "Existing overall allocation found for volume group",
      volumeGroupId,
      overallAllocation,
    });
    await deps.supplierQuotasRepo.updateOverallAllocation(
      volumeGroupId,
      supplierId,
      newAllocation,
    );
  } else {
    const newOverallAllocation: OverallAllocation = {
      id: volumeGroupId,
      volumeGroup: volumeGroupId,
      allocations: {
        [supplierId]: newAllocation,
      },
    };
    deps.logger.info({
      description:
        "No overall allocation found for volume group, creating new one",
      volumeGroupId,
      newOverallAllocation,
    });
    await deps.supplierQuotasRepo.putOverallAllocation(newOverallAllocation);
  }
  const dailyAllocationDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
  const dailyAllocation =
    await deps.supplierQuotasRepo.getDailyAllocation(dailyAllocationDate);
  if (dailyAllocation) {
    await deps.supplierQuotasRepo.updateDailyAllocation(
      dailyAllocationDate,
      supplierId,
      newAllocation,
    );
  } else {
    const newDailyAllocation: DailyAllocation = {
      id: `ID#${dailyAllocationDate}`,
      date: dailyAllocationDate,
      allocations: {
        [supplierId]: newAllocation,
      },
    };
    await deps.supplierQuotasRepo.putDailyAllocation(newDailyAllocation);
  }
}
