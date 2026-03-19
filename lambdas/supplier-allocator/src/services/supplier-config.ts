import {
  LetterVariant,
  PackSpecification,
  Supplier,
  SupplierAllocation,
  SupplierPack,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { Deps } from "../config/deps";

export async function getVariantDetails(
  variantId: string,
  deps: Deps,
): Promise<LetterVariant> {
  const variantDetails: LetterVariant =
    await deps.supplierConfigRepo.getLetterVariant(variantId);
  return variantDetails;
}

export async function getVolumeGroupDetails(
  groupId: string,
  deps: Deps,
): Promise<VolumeGroup> {
  const groupDetails: VolumeGroup =
    await deps.supplierConfigRepo.getVolumeGroup(groupId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (
    groupDetails.status === "PROD" &&
    new Date(groupDetails.startDate) < endOfDay &&
    (!groupDetails.endDate || new Date(groupDetails.endDate) >= startOfDay)
  ) {
    return groupDetails;
  }

  deps.logger.error({
    description: "Volume group is not active based on status and dates",
    groupId,
    status: groupDetails.status,
    startDate: groupDetails.startDate,
    endDate: groupDetails.endDate,
  });
  throw new Error(`Volume group with id ${groupId} is not active`);
}

export async function getSupplierAllocationsForVolumeGroup(
  groupId: string,
  deps: Deps,
  supplierId?: string,
): Promise<SupplierAllocation[]> {
  const allocations =
    await deps.supplierConfigRepo.getSupplierAllocationsForVolumeGroup(groupId);

  if (supplierId) {
    const filteredAllocations = allocations.filter(
      (alloc) => alloc.supplier === supplierId,
    );
    if (filteredAllocations.length === 0) {
      deps.logger.error({
        description:
          "No supplier allocations found for variantsupplier id in volume group",
        groupId,
        supplierId,
      });
      throw new Error(
        `No supplier allocations found for variant supplier id ${supplierId} in volume group ${groupId}`,
      );
    }
    return filteredAllocations;
  }

  return allocations;
}

export async function getSupplierDetails(
  supplierAllocations: SupplierAllocation[],
  deps: Deps,
): Promise<Supplier[]> {
  const supplierIds = supplierAllocations.map((alloc) => alloc.supplier);

  const supplierDetails: Supplier[] =
    await deps.supplierConfigRepo.getSuppliersDetails(supplierIds);

  if (Object.keys(supplierDetails).length === 0) {
    deps.logger.error({
      description: "No supplier details found for supplier allocations",
      supplierIds,
    });
    throw new Error(
      `No supplier details found for supplier ids ${supplierIds.join(", ")}`,
    );
  }
  // Log a warning if some supplier details are missing compared to allocations
  if (supplierAllocations.length !== supplierDetails.length) {
    const foundSupplierIds = new Set(supplierDetails.map((s) => s.id));
    const missingSupplierIds = supplierIds.filter(
      (id) => !foundSupplierIds.has(id),
    );
    deps.logger.warn({
      description: "Mismatch between supplier allocations and supplier details",
      allocationsCount: supplierAllocations.length,
      detailsCount: supplierDetails.length,
      missingSuppliers: missingSupplierIds,
    });
  }
  const activeSuppliers = supplierDetails.filter((s) => s.status === "PROD");
  if (activeSuppliers.length === 0) {
    deps.logger.error({
      description: "No active suppliers found for supplier allocations",
      supplierIds,
    });
    throw new Error(
      `No active suppliers found for supplier ids ${supplierIds.join(", ")}`,
    );
  }
  return activeSuppliers;
}

export async function getPreferredSupplierPacks(
  packSpecificationIds: string[],
  suppliers: Supplier[],
  deps: Deps,
): Promise<SupplierPack[]> {
  for (const packSpecId of packSpecificationIds) {
    const supplierPacks =
      await deps.supplierConfigRepo.getSupplierPacksForPackSpecification(
        packSpecId,
      );
    const preferredPacks = supplierPacks.filter((pack) =>
      suppliers.some((supplier) => supplier.id === pack.supplierId),
    );
    if (preferredPacks.length > 0) {
      return preferredPacks;
    }
  }
  deps.logger.error({
    description:
      "No preferred supplier packs found for pack specification ids and suppliers",
    packSpecificationIds,
    supplierIds: suppliers.map((s) => s.id),
  });
  throw new Error(
    `No preferred supplier packs found for pack specification ids ${packSpecificationIds.join(", ")} and suppliers ${suppliers.map((s) => s.id).join(", ")}`,
  );
}

export async function getPackSpecification(
  packSpecId: string,
  deps: Deps,
): Promise<PackSpecification> {
  const packSpec =
    await deps.supplierConfigRepo.getPackSpecification(packSpecId);
  return packSpec;
}
