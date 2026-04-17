import { OverallAllocation } from "@internal/datastore";
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

export async function updateSupplierQuota(
  groupId: string,
  supplierId: string,
  newAllocation: number,
  deps: Deps,
): Promise<void> {
  const overallAllocation =
    await deps.supplierQuotasRepo.getOverallAllocation(groupId);

  const updatedAllocations = overallAllocation
    ? {
        ...overallAllocation.allocations,
        [supplierId]: newAllocation,
      }
    : {
        [supplierId]: newAllocation,
      };

  const updatedOverallAllocation: OverallAllocation = overallAllocation
    ? {
        ...overallAllocation,
        allocations: updatedAllocations,
      }
    : {
        id: groupId,
        volumeGroup: groupId,
        allocations: updatedAllocations,
      };

  await deps.supplierQuotasRepo.putOverallAllocation(updatedOverallAllocation);
}
