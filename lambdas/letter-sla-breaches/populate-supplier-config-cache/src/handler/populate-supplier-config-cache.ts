import populateEntityCache, { EntityCacheDeps } from "./entity-cache";

export type PopulateSupplierConfigCacheEvent = {
  date: string;
};

export type PopulateSupplierConfigCacheResult = {
  status: "SUCCESS";
  message: string;
};

export const ENTITY_TYPES = [
  "volume-group",
  "supplier-pack",
  "letter-variant",
  "pack-specification",
  "supplier-allocation",
  "supplier",
];

export default function createHandler(deps: EntityCacheDeps) {
  return async (
    _event: PopulateSupplierConfigCacheEvent,
  ): Promise<PopulateSupplierConfigCacheResult> => {
    await Promise.all(
      ENTITY_TYPES.map((entityType) => populateEntityCache(deps, entityType)),
    );

    return {
      status: "SUCCESS",
      message: "populate-supplier-config-cache invoked successfully",
    };
  };
}
