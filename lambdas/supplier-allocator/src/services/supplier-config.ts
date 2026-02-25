import {
  LetterVariant,
  Supplier,
  SupplierAllocation,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { Deps } from "../config/deps";

export async function getVariantDetails(
  variantId: string,
  deps: Deps,
): Promise<LetterVariant> {
  deps.logger.info({
    description: "Fetching letter variant details from database",
    variantId,
  });

  const variantDetails: LetterVariant =
    await deps.supplierConfigRepo.getLetterVariant(variantId);

  if (variantDetails) {
    deps.logger.info({
      description: "Fetched letter variant details",
      variantId,
      variantDetails,
    });
  } else {
    deps.logger.error({
      description: "No letter variant found for id",
      variantId,
    });
  }
  return variantDetails;
}

export async function getVolumeGroupDetails(
  groupId: string,
  deps: Deps,
): Promise<VolumeGroup> {
  deps.logger.info({
    description: "Fetching volume group details from database",
    groupId,
  });

  const groupDetails = await deps.supplierConfigRepo.getVolumeGroup(groupId);
  if (groupDetails) {
    deps.logger.info({
      description: "Fetched volume group details",
      groupId,
      groupDetails,
    });
  } else {
    deps.logger.error({
      description: "No volume group found for id",
      groupId,
    });
  }

  if (
    groupDetails.status !== "PROD" &&
    (new Date(groupDetails.startDate) > new Date() ||
      (groupDetails.endDate && new Date(groupDetails.endDate) < new Date()))
  ) {
    deps.logger.error({
      description: "Volume group is not active based on status and dates",
      groupId,
      status: groupDetails.status,
      startDate: groupDetails.startDate,
      endDate: groupDetails.endDate,
    });
    throw new Error(`Volume group with id ${groupId} is not active`);
  }
  return groupDetails;
}

export async function getSupplierAllocationsForVolumeGroup(
  groupId: string,
  supplierId: string,
  deps: Deps,
): Promise<SupplierAllocation[]> {
  deps.logger.info({
    description: "Fetching supplier allocations for volume group from database",
    groupId,
  });
  const allocations =
    await deps.supplierConfigRepo.getSupplierAllocationsForVolumeGroup(groupId);

  if (allocations.length > 0) {
    deps.logger.info({
      description:
        "Fetched supplier allocations for volume group from database",
      groupId,
      count: allocations.length,
    });
  } else {
    deps.logger.error({
      description: "No supplier allocations found for volume group id",
      groupId,
    });
  }

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

  deps.logger.info({
    description: "Fetched supplier details for supplier allocations",
    supplierIds,
    supplierDetails,
  });

  if (Object.keys(supplierDetails).length === 0) {
    deps.logger.error({
      description: "No supplier details found for supplier allocations",
      supplierIds,
    });
    throw new Error(
      `No supplier details found for supplier ids ${supplierIds.join(", ")}`,
    );
  }
  return supplierDetails;
}
