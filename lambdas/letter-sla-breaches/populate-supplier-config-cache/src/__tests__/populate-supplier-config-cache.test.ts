import { $SupplierConfigEntity } from "@internal/datastore";
import populateEntityCache, { EntityCacheDeps } from "../handler/entity-cache";
import createHandler, {
  ENTITY_TYPES,
} from "../handler/populate-supplier-config-cache";

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
    jest.mocked(populateEntityCache).mockReset();
    for (const [index] of ENTITY_TYPES.entries()) {
      jest.mocked(populateEntityCache).mockResolvedValueOnce(index + 1);
    }
    const handler = createHandler(deps);

    const result = await handler();

    expect(ENTITY_TYPES).toEqual($SupplierConfigEntity.options);
    expect(populateEntityCache).toHaveBeenCalledTimes(ENTITY_TYPES.length);
    for (const entityType of ENTITY_TYPES) {
      expect(populateEntityCache).toHaveBeenCalledWith(deps, entityType);
    }
    expect(result).toEqual({
      status: "SUCCESS",
    });
  });

  it("returns failure when an entity fails", async () => {
    const deps = { logger: { error: jest.fn() } } as unknown as EntityCacheDeps;
    jest
      .mocked(populateEntityCache)
      .mockReset()
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error("query failed"))
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(6);
    const handler = createHandler(deps);

    const result = await handler();

    expect(result).toEqual({
      status: "FAILURE",
      failureReason: `Failed to populate supplier config cache for: ${ENTITY_TYPES[1]}`,
    });
    expect(deps.logger.error).toHaveBeenCalledWith(
      { entityType: ENTITY_TYPES[1], error: expect.any(Error) },
      "Failed to populate supplier config entity cache",
    );
  });
});
