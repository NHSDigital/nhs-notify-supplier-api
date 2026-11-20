import { $SupplierConfigEntity } from "@internal/datastore";
import populateEntityCache, { EntityCacheDeps } from "../handler/entity-cache";
import createHandler from "../handler/populate-supplier-config-cache";

jest.mock("@internal/datastore", () => ({
  $SupplierConfigEntity: {
    options: [
      "letter-variant",
      "volume-group",
      "supplier-allocation",
      "supplier",
      "pack-specification",
      "supplier-pack",
    ],
  },
}));
jest.mock("../handler/entity-cache");

describe("populateSupplierConfigCache", () => {
  it("populates the cache once for each entity type and returns success", async () => {
    const deps = { logger: { error: jest.fn() } } as unknown as EntityCacheDeps;
    const entityTypes = $SupplierConfigEntity.options;
    jest.mocked(populateEntityCache).mockReset();
    for (const [index] of entityTypes.entries()) {
      jest.mocked(populateEntityCache).mockResolvedValueOnce(index + 1);
    }
    const handler = createHandler(deps);

    const result = await handler();

    expect(populateEntityCache).toHaveBeenCalledTimes(entityTypes.length);
    for (const entityType of entityTypes) {
      expect(populateEntityCache).toHaveBeenCalledWith(deps, entityType);
    }
    expect(result).toEqual({
      status: "SUCCESS",
    });
  });

  it("returns failure when an entity fails", async () => {
    const deps = { logger: { error: jest.fn() } } as unknown as EntityCacheDeps;
    const entityTypes = $SupplierConfigEntity.options;
    jest.mocked(populateEntityCache).mockReset();
    for (const [index] of entityTypes.entries()) {
      if (index === 1) {
        jest
          .mocked(populateEntityCache)
          .mockRejectedValueOnce(new Error("query failed"));
      } else {
        jest.mocked(populateEntityCache).mockResolvedValueOnce(index + 1);
      }
    }
    const handler = createHandler(deps);

    const result = await handler();

    expect(result).toEqual({
      status: "FAILURE",
      failureReason: `Failed to populate supplier config cache for: ${entityTypes[1]}`,
    });
    expect(deps.logger.error).toHaveBeenCalledWith(
      { entityType: entityTypes[1], error: expect.any(Error) },
      "Failed to populate supplier config entity cache",
    );
  });
});
