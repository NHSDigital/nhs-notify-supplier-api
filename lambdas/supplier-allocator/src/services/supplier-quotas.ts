import { SupplierAllocation } from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
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
  await deps.supplierQuotasRepo.updateOverallAllocation(
    volumeGroupId,
    supplierId,
    newAllocation,
  );

  const dailyAllocationDate = format(
    toZonedTime(new Date(), "Europe/London"),
    "yyyy-MM-dd",
  );

  await deps.supplierQuotasRepo.updateDailyAllocation(
    dailyAllocationDate,
    supplierId,
    newAllocation,
  );
}
