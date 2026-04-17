import {
  LetterVariant,
  PackSpecification,
  Supplier,
  SupplierAllocation,
  SupplierPack,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";

import { Deps } from "../config/deps";

type PreparedEvents = LetterRequestPreparedEventV2 | LetterRequestPreparedEvent;

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
  supplierIds: string[],
  deps: Deps,
): Promise<Supplier[]> {
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
  if (supplierIds.length !== supplierDetails.length) {
    const foundSupplierIds = new Set(supplierDetails.map((s) => s.id));
    const missingSupplierIds = supplierIds.filter(
      (id) => !foundSupplierIds.has(id),
    );
    deps.logger.warn({
      description: "Mismatch between supplier allocations and supplier details",
      allocationsCount: supplierIds.length,
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
    if (supplierPacks.length > 0) {
      const preferredPacks = supplierPacks.filter((pack) =>
        suppliers.some((supplier) => supplier.id === pack.supplierId),
      );
      if (preferredPacks.length > 0) {
        return preferredPacks;
      }
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
  if (packSpec.status !== "PROD") {
    deps.logger.error({
      description: "Pack specification is not active based on status",
      packSpecId,
      status: packSpec.status,
    });
    throw new Error(`Pack specification with id ${packSpecId} is not active`);
  }
  return packSpec;
}

// This function is used to filter the allocated suppliers based on those that support the supplied pack specification
export async function getSuppliersWithValidPack(
  suppliers: Supplier[],
  packSpecificationId: string,
  deps: Deps,
): Promise<Supplier[]> {
  const suppliersWithValidPack: Supplier[] = [];
  const supplierPacks =
    await deps.supplierConfigRepo.getSupplierPacksForPackSpecification(
      packSpecificationId,
    );

  for (const supplier of suppliers) {
    const hasValidPack = supplierPacks.some(
      (pack) => pack.supplierId === supplier.id,
    );
    if (hasValidPack) {
      suppliersWithValidPack.push(supplier);
    }
  }

  return suppliersWithValidPack;
}

function evaluateContraint(
  actualValue: number,
  constraintValue: number,
  operator: string,
): boolean {
  switch (operator) {
    case "EQUALS": {
      return actualValue === constraintValue;
    }
    case "NOT_EQUALS": {
      return actualValue !== constraintValue;
    }
    case "GREATER_THAN": {
      return actualValue > constraintValue;
    }
    case "LESS_THAN": {
      return actualValue < constraintValue;
    }
    case "GREATER_THAN_OR_EQUAL": {
      return actualValue >= constraintValue;
    }
    case "LESS_THAN_OR_EQUAL": {
      return actualValue <= constraintValue;
    }
    default: {
      throw new Error(
        `Unsupported operator ${operator} in pack specification constraints`,
      );
    }
  }
}

// This function is used to filter the pack specifications for a letter based on the letter data pages and pack specification constraints sheets

export async function filterPacksForLetter(
  letterEvent: PreparedEvents,
  packSpecificationIds: string[],
  deps: Deps,
): Promise<string[]> {
  const filteredPackIds: string[] = [];
  for (const packSpecId of packSpecificationIds) {
    const packSpec =
      await deps.supplierConfigRepo.getPackSpecification(packSpecId);
    if (
      !packSpec.constraints ||
      !packSpec.constraints.sheets ||
      !packSpec.constraints.sheets.value ||
      !packSpec.constraints.sheets.operator
    ) {
      filteredPackIds.push(packSpecId);
    } else {
      deps.logger.info({
        description: "Evaluating pack specification constraints for letter",
        letterVariantId: letterEvent.data.letterVariantId,
        packSpecId,
        pageCount: letterEvent.data.pageCount,
        constraintValue: packSpec.constraints.sheets.value,
        constraintOperator: packSpec.constraints.sheets.operator,
      });
      const isValid = evaluateContraint(
        letterEvent.data.pageCount,
        packSpec.constraints.sheets.value,
        packSpec.constraints.sheets.operator,
      );
      if (isValid) {
        filteredPackIds.push(packSpecId);
      }
    }
  }
  if (filteredPackIds.length === 0) {
    deps.logger.error({
      description: "No eligible pack specifications found for letter",
      letterVariantId: letterEvent.data.letterVariantId,
      packSpecificationIds,
    });
    throw new Error(
      `No eligible pack specifications found for letter variant id ${letterEvent.data.letterVariantId} and pack specification ids ${packSpecificationIds.join(", ")}`,
    );
  }
  return filteredPackIds;
}
