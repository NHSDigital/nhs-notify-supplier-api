import {
  PackSpecification,
  Supplier,
  SupplierAllocation,
  SupplierPack,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import {
  filterPacksForLetter,
  getPackSpecification,
  getPreferredSupplierPacks,
  getSupplierAllocationsForVolumeGroup,
  getSupplierDetails,
  getSupplierPacks,
} from "../services/supplier-config";
import { calculateSupplierAllocatedFactor } from "../services/supplier-quotas";
import { Deps } from "../config/deps";
import { PreparedEvents } from "./types";

export async function eligibleSuppliers(
  volumeGroup: VolumeGroup,
  deps: Deps,
): Promise<{
  supplierAllocations: SupplierAllocation[];
  suppliers: Supplier[];
}> {
  const supplierAllocations = await getSupplierAllocationsForVolumeGroup(
    volumeGroup.id,
    deps,
  );
  const supplierIds = supplierAllocations.map((alloc) => alloc.supplier);

  const suppliers = await getSupplierDetails(supplierIds, deps);
  return { supplierAllocations, suppliers };
}

export async function preferredSupplierPack(
  letterEvent: PreparedEvents,
  suppliers: Supplier[],
  packSpecificationIds: string[],
  deps: Deps,
): Promise<PackSpecification> {
  const eligiblePacks: string[] = await filterPacksForLetter(
    letterEvent,
    packSpecificationIds,
    deps,
  );
  const preferredSupplierPacks: SupplierPack[] =
    await getPreferredSupplierPacks(eligiblePacks, suppliers, deps);
  const preferredPack: PackSpecification = await getPackSpecification(
    preferredSupplierPacks[0].packSpecificationId,
    deps,
  );
  return preferredPack;
}

// This function is used to filter the allocated suppliers based on those that support the supplied pack specification
export async function suppliersWithValidPack(
  suppliers: Supplier[],
  packSpecificationId: string,
  deps: Deps,
): Promise<Supplier[]> {
  const validSuppliers: Supplier[] = [];
  const supplierPacks = await getSupplierPacks(packSpecificationId, deps);

  for (const supplier of suppliers) {
    const hasValidPack = supplierPacks.some(
      (pack) => pack.supplierId === supplier.id,
    );
    if (hasValidPack) {
      validSuppliers.push(supplier);
    }
  }

  return validSuppliers;
}

export async function filterSuppliersWithCapacity(
  suppliers: Supplier[],
  volumeGroupId: string,
  deps: Deps,
): Promise<Supplier[]> {
  const dailyAllocationDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
  const dailyAllocation = await deps.supplierQuotasRepo.getDailyAllocation(
    volumeGroupId,
    dailyAllocationDate,
  );
  if (dailyAllocation) {
    const suppliersWithCapacity = suppliers.filter((supplier) => {
      const allocated = dailyAllocation.allocations[supplier.id] ?? 0;
      return allocated < supplier.dailyCapacity;
    });
    return suppliersWithCapacity;
  }
  return suppliers; // If no daily allocation exists, assume all suppliers have capacity
}

export async function selectSupplierByFactor(
  suppliers: Supplier[],
  supplierAllocations: SupplierAllocation[],
  deps: Deps,
): Promise<string> {
  const supplierAllocationsForPack = supplierAllocations.filter((alloc) =>
    suppliers.some((supplier) => supplier.id === alloc.supplier),
  );
  const supplierFactors: { supplierId: string; factor: number }[] =
    await calculateSupplierAllocatedFactor(supplierAllocationsForPack, deps);

  deps.logger.info({
    description: "Calculated supplier factors for allocation",
    supplierFactors,
  });
  let selectedSupplierId = supplierFactors[0].supplierId;
  let lowestFactor = supplierFactors[0].factor;
  for (const supplierFactor of supplierFactors) {
    if (supplierFactor.factor < lowestFactor) {
      lowestFactor = supplierFactor.factor;
      selectedSupplierId = supplierFactor.supplierId;
    }
  }
  return selectedSupplierId;
}
