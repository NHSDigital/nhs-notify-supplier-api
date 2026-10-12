import populateEntityCache, { EntityCacheDeps } from "./entity-cache";

export type PopulateSupplierConfigCacheResult = {
  status: "SUCCESS" | "FAILURE";
  failureReason?: string;
  entities: {
    entity: string;
    recordsRetrieved: number;
  }[];
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
  return async (): Promise<PopulateSupplierConfigCacheResult> => {
    const results = await Promise.all(
      ENTITY_TYPES.map(async (entityType) => {
        try {
          return {
            entity: entityType,
            recordsRetrieved: await populateEntityCache(deps, entityType),
            failed: false,
          };
        } catch (error) {
          deps.logger.error(
            { entityType, error },
            "Failed to populate supplier config entity cache",
          );
          return { entity: entityType, recordsRetrieved: 0, failed: true };
        }
      }),
    );
    const entities = results.map(({ entity, recordsRetrieved }) => ({
      entity,
      recordsRetrieved,
    }));
    const failedEntities = results
      .filter((result) => result.failed)
      .map((result) => result.entity);

    if (failedEntities.length > 0) {
      return {
        status: "FAILURE",
        failureReason: `Failed to populate supplier config cache for: ${failedEntities.join(", ")}`,
        entities,
      };
    }

    return {
      status: "SUCCESS",
      entities,
    };
  };
}
