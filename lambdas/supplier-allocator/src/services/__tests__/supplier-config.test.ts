import {
  getSupplierAllocationsForVolumeGroup,
  getSupplierDetails,
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
    it("returns variant details", async () => {
      const variant = { id: "v1", volumeGroupId: "g1" } as any;
      const deps = makeDeps();
      deps.supplierConfigRepo.getLetterVariant = jest
        .fn()
        .mockResolvedValue(variant);

      const result = await getVariantDetails("v1", deps);

      expect(result).toBe(variant);
    });

    it("returns undefined when not found", async () => {
      const variant = undefined;
      const deps = makeDeps();
      deps.supplierConfigRepo.getLetterVariant = jest
        .fn()
        .mockResolvedValue(variant);

      const result = await getVariantDetails("missing", deps);

      expect(result).toBeUndefined();
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
    });
    it("logs an error and returns group details when not found", async () => {
      const group = undefined;
      const deps = makeDeps();
      deps.supplierConfigRepo.getVolumeGroup = jest
        .fn()
        .mockResolvedValue(group);

      const result = await getVolumeGroupDetails("missing", deps);

      expect(result).toBeUndefined();
    });

    it("throws when group is not active based on status", async () => {
      const group = {
        id: "g2",
        status: "DRAFT",
        startDate: "2020-01-01",
      } as any;
      const deps = makeDeps();
      deps.supplierConfigRepo.getVolumeGroup = jest
        .fn()
        .mockResolvedValue(group);

      await expect(getVolumeGroupDetails("g2", deps)).rejects.toThrow(
        /not active/,
      );
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("throws when group is not active based on start date", async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      const group = { id: "g3", status: "PROD", startDate: future } as any;
      const deps = makeDeps();
      deps.supplierConfigRepo.getVolumeGroup = jest
        .fn()
        .mockResolvedValue(group);

      await expect(getVolumeGroupDetails("g3", deps)).rejects.toThrow(
        /not active/,
      );
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("throws when group is not active based on end date", async () => {
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      const group = {
        id: "g3",
        status: "PROD",
        startDate: "2020-01-01",
        endDate: past,
      } as any;
      const deps = makeDeps();
      deps.supplierConfigRepo.getVolumeGroup = jest
        .fn()
        .mockResolvedValue(group);

      await expect(getVolumeGroupDetails("g3", deps)).rejects.toThrow(
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

  describe("getSupplierDetails", () => {
    it("returns supplier details when found", async () => {
      const allocations = [
        { supplier: "s1", variantId: "v1" },
        { supplier: "s2", variantId: "v2" },
      ] as any[];
      const suppliers = [
        { id: "s1", name: "Supplier 1" },
        { id: "s2", name: "Supplier 2" },
      ] as any[];
      const deps = makeDeps();
      deps.supplierConfigRepo.getSuppliersDetails = jest
        .fn()
        .mockResolvedValue(suppliers);

      const result = await getSupplierDetails(allocations, deps);

      expect(result).toEqual(suppliers);
      expect(deps.supplierConfigRepo.getSuppliersDetails).toHaveBeenCalledWith([
        "s1",
        "s2",
      ]);
    });

    it("throws when no supplier details found", async () => {
      const allocations = [{ supplier: "s1", variantId: "v1" }] as any[];
      const deps = makeDeps();
      deps.supplierConfigRepo.getSuppliersDetails = jest
        .fn()
        .mockResolvedValue([]);

      await expect(getSupplierDetails(allocations, deps)).rejects.toThrow(
        /No supplier details found/,
      );
    });

    it("extracts supplier ids from allocations and requests details", async () => {
      const allocations = [
        { supplier: "s1", variantId: "v1" },
        { supplier: "s3", variantId: "v2" },
        { supplier: "s5", variantId: "v3" },
      ] as any[];
      const suppliers = [
        { id: "s1", name: "Supplier 1" },
        { id: "s3", name: "Supplier 3" },
        { id: "s5", name: "Supplier 5" },
      ] as any[];
      const deps = makeDeps();
      deps.supplierConfigRepo.getSuppliersDetails = jest
        .fn()
        .mockResolvedValue(suppliers);

      await getSupplierDetails(allocations, deps);

      expect(deps.supplierConfigRepo.getSuppliersDetails).toHaveBeenCalledWith([
        "s1",
        "s3",
        "s5",
      ]);
    });
  });
});
