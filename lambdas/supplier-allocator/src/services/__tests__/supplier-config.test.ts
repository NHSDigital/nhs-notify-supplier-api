import {
  getSupplierAllocationsForVolumeGroup,
  getVariantDetails,
  getVolumeGroupDetails,
} from "../supplier-config";
import { Deps } from "../../config/deps";

function makeDeps(overrides: Partial<Deps> = {}): Deps {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Deps["logger"];

  const supplierConfigRepo = {
    getLetterVariant: jest.fn(),
    getVolumeGroup: jest.fn(),
    getSupplierAllocationsForVolumeGroup: jest.fn(),
  } as unknown as Deps["supplierConfigRepo"];

  const base: Partial<Deps> = {
    logger: logger as any,
    supplierConfigRepo: supplierConfigRepo as any,
  };

  return { ...(base as Deps), ...overrides } as Deps;
}

describe("supplier-config service", () => {
  afterEach(() => jest.resetAllMocks());

  describe("getVariantDetails", () => {
    it("returns variant details and logs when found", async () => {
      const variant = { id: "v1", volumeGroupId: "g1" } as any;
      const deps = makeDeps();
      deps.supplierConfigRepo.getLetterVariant = jest
        .fn()
        .mockResolvedValue(variant);

      const result = await getVariantDetails("v1", deps);

      expect(result).toBe(variant);
      expect(deps.logger.info).toHaveBeenCalled();
    });

    it("logs an error and returns undefined when not found", async () => {
      const deps = makeDeps();
      deps.supplierConfigRepo.getLetterVariant = jest.fn().mockResolvedValue();

      const result = await getVariantDetails("missing", deps);

      expect(result).toBeUndefined();
      expect(deps.logger.error).toHaveBeenCalled();
    });
  });

  describe("getVolumeGroupDetails", () => {
    it("returns group details when active", async () => {
      const group = {
        id: "g1",
        status: "PROD",
        startDate: "2020-01-01",
      } as any;
      const deps = makeDeps();
      deps.supplierConfigRepo.getVolumeGroup = jest
        .fn()
        .mockResolvedValue(group);

      const result = await getVolumeGroupDetails("g1", deps);

      expect(result).toBe(group);
      expect(deps.logger.info).toHaveBeenCalled();
    });

    it("throws when group is not active based on dates/status", async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      const group = { id: "g2", status: "DRAFT", startDate: future } as any;
      const deps = makeDeps();
      deps.supplierConfigRepo.getVolumeGroup = jest
        .fn()
        .mockResolvedValue(group);

      await expect(getVolumeGroupDetails("g2", deps)).rejects.toThrow(
        /not active/,
      );
      expect(deps.logger.error).toHaveBeenCalled();
    });
  });

  describe("getSupplierAllocationsForVolumeGroup", () => {
    const allocations = [
      { supplier: "s1", variantId: "v1" },
      { supplier: "s2", variantId: "v2" },
    ] as any[];

    it("returns all allocations when no supplierId provided", async () => {
      const deps = makeDeps();
      deps.supplierConfigRepo.getSupplierAllocationsForVolumeGroup = jest
        .fn()
        .mockResolvedValue(allocations);

      const result = await getSupplierAllocationsForVolumeGroup("g1", "", deps);

      expect(result).toEqual(allocations);
      expect(deps.logger.info).toHaveBeenCalled();
    });

    it("filters by supplierId when provided", async () => {
      const deps = makeDeps();
      deps.supplierConfigRepo.getSupplierAllocationsForVolumeGroup = jest
        .fn()
        .mockResolvedValue(allocations);

      const result = await getSupplierAllocationsForVolumeGroup(
        "g1",
        "s2",
        deps,
      );

      expect(result).toEqual([allocations[1]]);
    });

    it("throws when supplierId provided but no matching allocation", async () => {
      const deps = makeDeps();
      deps.supplierConfigRepo.getSupplierAllocationsForVolumeGroup = jest
        .fn()
        .mockResolvedValue(allocations);

      await expect(
        getSupplierAllocationsForVolumeGroup("g1", "missing", deps),
      ).rejects.toThrow(/No supplier allocations found/);
      expect(deps.logger.error).toHaveBeenCalled();
    });
  });
});
