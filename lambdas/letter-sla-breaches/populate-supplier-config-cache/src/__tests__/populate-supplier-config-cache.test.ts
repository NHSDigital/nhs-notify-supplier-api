import populateEntityCache, { EntityCacheDeps } from "../handler/entity-cache";
import createHandler, {
  ENTITY_TYPES,
} from "../handler/populate-supplier-config-cache";

jest.mock("../handler/entity-cache");

describe("populateSupplierConfigCache", () => {
  it("populates the cache once for each entity type and returns success", async () => {
    const deps = {} as EntityCacheDeps;
    const handler = createHandler(deps);

    const result = await handler({ date: "2026-10-08" });

    expect(ENTITY_TYPES).toEqual([
      "volume-group",
      "supplier-pack",
      "letter-variant",
      "pack-specification",
      "supplier-allocation",
      "supplier",
    ]);
    expect(populateEntityCache).toHaveBeenCalledTimes(ENTITY_TYPES.length);
    for (const entityType of ENTITY_TYPES) {
      expect(populateEntityCache).toHaveBeenCalledWith(deps, entityType);
    }
    expect(result).toEqual({
      status: "SUCCESS",
      message: "populate-supplier-config-cache invoked successfully",
    });
  });
});
