import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";

import {
  PackSpecification,
  Supplier,
  SupplierAllocation,
  SupplierPack,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { Deps } from "../../config/deps";
import {
  eligibleSuppliers,
  filterSuppliersWithCapacity,
  preferredSupplierPack,
  selectSupplierByFactor,
  suppliersWithValidPack,
} from "../allocation-config";
import * as supplierConfigService from "../../services/supplier-config";
import * as supplierQuotasService from "../../services/supplier-quotas";

jest.mock("../../services/supplier-config");
jest.mock("../../services/supplier-quotas");

describe("eligibleSuppliers", () => {
  let mockDeps: jest.Mocked<Deps>;
  let mockVolumeGroup: VolumeGroup;
  let mockSupplierAllocations: SupplierAllocation[];
  let mockSuppliers: Supplier[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockVolumeGroup = {
      id: "volume-group-1",
      name: "Test Volume Group",
    } as VolumeGroup;

    mockSupplierAllocations = [
      {
        id: "allocation-1",
        volumeGroup: "volume-group-1",
        supplier: "supplier-1",
        allocationPercentage: 50,
        status: "PROD",
      } as SupplierAllocation,
      {
        id: "allocation-2",
        volumeGroup: "volume-group-1",
        supplier: "supplier-2",
        allocationPercentage: 30,
        status: "PROD",
      } as SupplierAllocation,
    ];

    mockSuppliers = [
      {
        id: "supplier-1",
        name: "Supplier One",
        dailyCapacity: 1000,
      } as Supplier,
      {
        id: "supplier-2",
        name: "Supplier Two",
        dailyCapacity: 500,
      } as Supplier,
    ];

    mockDeps = {
      logger: { info: jest.fn(), error: jest.fn() },
    } as unknown as jest.Mocked<Deps>;
  });

  it("should return supplier allocations and suppliers when successful", async () => {
    (
      supplierConfigService.getSupplierAllocationsForVolumeGroup as jest.Mock
    ).mockResolvedValue(mockSupplierAllocations);
    (supplierConfigService.getSupplierDetails as jest.Mock).mockResolvedValue(
      mockSuppliers,
    );

    const result = await eligibleSuppliers(mockVolumeGroup, mockDeps);

    expect(result.supplierAllocations).toEqual(mockSupplierAllocations);
    expect(result.suppliers).toEqual(mockSuppliers);
  });

  it("should call getSupplierAllocationsForVolumeGroup with correct volume group id", async () => {
    (
      supplierConfigService.getSupplierAllocationsForVolumeGroup as jest.Mock
    ).mockResolvedValue(mockSupplierAllocations);
    (supplierConfigService.getSupplierDetails as jest.Mock).mockResolvedValue(
      mockSuppliers,
    );

    await eligibleSuppliers(mockVolumeGroup, mockDeps);

    expect(
      supplierConfigService.getSupplierAllocationsForVolumeGroup,
    ).toHaveBeenCalledWith("volume-group-1", mockDeps);
  });

  it("should extract supplier ids from allocations and call getSupplierDetails", async () => {
    (
      supplierConfigService.getSupplierAllocationsForVolumeGroup as jest.Mock
    ).mockResolvedValue(mockSupplierAllocations);
    (supplierConfigService.getSupplierDetails as jest.Mock).mockResolvedValue(
      mockSuppliers,
    );

    await eligibleSuppliers(mockVolumeGroup, mockDeps);

    expect(supplierConfigService.getSupplierDetails).toHaveBeenCalledWith(
      ["supplier-1", "supplier-2"],
      mockDeps,
    );
  });

  it("should handle empty supplier allocations", async () => {
    (
      supplierConfigService.getSupplierAllocationsForVolumeGroup as jest.Mock
    ).mockResolvedValue([]);
    (supplierConfigService.getSupplierDetails as jest.Mock).mockResolvedValue(
      [],
    );

    const result = await eligibleSuppliers(mockVolumeGroup, mockDeps);

    expect(result.supplierAllocations).toEqual([]);
    expect(result.suppliers).toEqual([]);
    expect(supplierConfigService.getSupplierDetails).toHaveBeenCalledWith(
      [],
      mockDeps,
    );
  });

  it("should propagate errors from getSupplierAllocationsForVolumeGroup", async () => {
    const error = new Error("Database error");
    (
      supplierConfigService.getSupplierAllocationsForVolumeGroup as jest.Mock
    ).mockRejectedValue(error);

    await expect(eligibleSuppliers(mockVolumeGroup, mockDeps)).rejects.toThrow(
      "Database error",
    );
  });

  it("should propagate errors from getSupplierDetails", async () => {
    (
      supplierConfigService.getSupplierAllocationsForVolumeGroup as jest.Mock
    ).mockResolvedValue(mockSupplierAllocations);
    const error = new Error("Supplier service error");
    (supplierConfigService.getSupplierDetails as jest.Mock).mockRejectedValue(
      error,
    );

    await expect(eligibleSuppliers(mockVolumeGroup, mockDeps)).rejects.toThrow(
      "Supplier service error",
    );
  });
});

describe("preferredSupplierPack", () => {
  let mockLetterEvent: LetterRequestPreparedEventV2;
  let mockPackSpecificationIds: string[];
  let mockDeps: jest.Mocked<Deps>;
  let mockSuppliers: Supplier[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockLetterEvent = {
      letterid: "letter-1",
      specification: "spec-1",
    } as unknown as LetterRequestPreparedEventV2;

    mockSuppliers = [
      {
        id: "supplier-1",
        name: "Supplier One",
        dailyCapacity: 1000,
      } as Supplier,
    ];

    mockPackSpecificationIds = ["pack-spec-1", "pack-spec-2"];

    mockDeps = {
      logger: { info: jest.fn(), error: jest.fn() },
    } as unknown as jest.Mocked<Deps>;
  });

  it("should return preferred pack specification when successful", async () => {
    const mockEligiblePacks = ["pack-spec-1"];
    const mockPreferredSupplierPacks = [
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-1",
      } as SupplierPack,
    ];
    const mockPackSpecification = {
      id: "pack-spec-1",
      name: "Preferred Pack",
    } as PackSpecification;

    (supplierConfigService.filterPacksForLetter as jest.Mock).mockResolvedValue(
      mockEligiblePacks,
    );
    (
      supplierConfigService.getPreferredSupplierPacks as jest.Mock
    ).mockResolvedValue(mockPreferredSupplierPacks);
    (supplierConfigService.getPackSpecification as jest.Mock).mockResolvedValue(
      mockPackSpecification,
    );

    const result = await preferredSupplierPack(
      mockLetterEvent,
      mockSuppliers,
      mockPackSpecificationIds,
      mockDeps,
    );

    expect(result).toEqual(mockPackSpecification);
  });

  it("should call filterPacksForLetter with correct parameters", async () => {
    (supplierConfigService.filterPacksForLetter as jest.Mock).mockResolvedValue(
      ["pack-spec-1"],
    );
    (
      supplierConfigService.getPreferredSupplierPacks as jest.Mock
    ).mockResolvedValue([
      { packSpecificationId: "pack-spec-1", supplierId: "supplier-1" },
    ]);
    (supplierConfigService.getPackSpecification as jest.Mock).mockResolvedValue(
      { id: "pack-spec-1", name: "Pack" },
    );

    await preferredSupplierPack(
      mockLetterEvent,
      mockSuppliers,
      mockPackSpecificationIds,
      mockDeps,
    );

    expect(supplierConfigService.filterPacksForLetter).toHaveBeenCalledWith(
      mockLetterEvent,
      mockPackSpecificationIds,
      mockDeps,
    );
  });

  it("should call getPreferredSupplierPacks with eligible packs and suppliers", async () => {
    const mockEligiblePacks = ["pack-spec-1", "pack-spec-2"];
    (supplierConfigService.filterPacksForLetter as jest.Mock).mockResolvedValue(
      mockEligiblePacks,
    );
    (
      supplierConfigService.getPreferredSupplierPacks as jest.Mock
    ).mockResolvedValue([
      { packSpecificationId: "pack-spec-1", supplierId: "supplier-1" },
    ]);
    (supplierConfigService.getPackSpecification as jest.Mock).mockResolvedValue(
      { id: "pack-spec-1", name: "Pack" },
    );

    await preferredSupplierPack(
      mockLetterEvent,
      mockSuppliers,
      mockPackSpecificationIds,
      mockDeps,
    );

    expect(
      supplierConfigService.getPreferredSupplierPacks,
    ).toHaveBeenCalledWith(mockEligiblePacks, mockSuppliers, mockDeps);
  });

  it("should call getPackSpecification with the first preferred pack id", async () => {
    (supplierConfigService.filterPacksForLetter as jest.Mock).mockResolvedValue(
      ["pack-spec-1"],
    );
    (
      supplierConfigService.getPreferredSupplierPacks as jest.Mock
    ).mockResolvedValue([
      { packSpecificationId: "pack-spec-1", supplierId: "supplier-1" },
    ]);
    (supplierConfigService.getPackSpecification as jest.Mock).mockResolvedValue(
      { id: "pack-spec-1", name: "Pack" },
    );

    await preferredSupplierPack(
      mockLetterEvent,
      mockSuppliers,
      mockPackSpecificationIds,
      mockDeps,
    );

    expect(supplierConfigService.getPackSpecification).toHaveBeenCalledWith(
      "pack-spec-1",
      mockDeps,
    );
  });

  it("should propagate errors from filterPacksForLetter", async () => {
    const error = new Error("Filter error");
    (supplierConfigService.filterPacksForLetter as jest.Mock).mockRejectedValue(
      error,
    );

    await expect(
      preferredSupplierPack(
        mockLetterEvent,
        mockSuppliers,
        mockPackSpecificationIds,
        mockDeps,
      ),
    ).rejects.toThrow("Filter error");
  });

  it("should propagate errors from getPreferredSupplierPacks", async () => {
    (supplierConfigService.filterPacksForLetter as jest.Mock).mockResolvedValue(
      ["pack-spec-1"],
    );
    const error = new Error("Preference error");
    (
      supplierConfigService.getPreferredSupplierPacks as jest.Mock
    ).mockRejectedValue(error);

    await expect(
      preferredSupplierPack(
        mockLetterEvent,
        mockSuppliers,
        mockPackSpecificationIds,
        mockDeps,
      ),
    ).rejects.toThrow("Preference error");
  });

  it("should propagate errors from getPackSpecification", async () => {
    (supplierConfigService.filterPacksForLetter as jest.Mock).mockResolvedValue(
      ["pack-spec-1"],
    );
    (
      supplierConfigService.getPreferredSupplierPacks as jest.Mock
    ).mockResolvedValue([
      { packSpecificationId: "pack-spec-1", supplierId: "supplier-1" },
    ]);
    const error = new Error("Pack specification error");
    (supplierConfigService.getPackSpecification as jest.Mock).mockRejectedValue(
      error,
    );

    await expect(
      preferredSupplierPack(
        mockLetterEvent,
        mockSuppliers,
        mockPackSpecificationIds,
        mockDeps,
      ),
    ).rejects.toThrow("Pack specification error");
  });
});

describe("suppliersWithValidPack", () => {
  let mockPackSpecificationId: string;
  let mockDeps: jest.Mocked<Deps>;
  let mockSuppliers: Supplier[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSuppliers = [
      {
        id: "supplier-1",
        name: "Supplier One",
        dailyCapacity: 1000,
      } as Supplier,
      {
        id: "supplier-2",
        name: "Supplier Two",
        dailyCapacity: 500,
      } as Supplier,
      {
        id: "supplier-3",
        name: "Supplier Three",
        dailyCapacity: 750,
      } as Supplier,
    ];

    mockPackSpecificationId = "pack-spec-1";

    mockDeps = {
      logger: { info: jest.fn(), error: jest.fn() },
    } as unknown as jest.Mocked<Deps>;
  });

  it("should return suppliers that have valid packs for the specification", async () => {
    const mockSupplierPacks = [
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-1",
      } as SupplierPack,
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-3",
      } as SupplierPack,
    ];

    (supplierConfigService.getSupplierPacks as jest.Mock).mockResolvedValue(
      mockSupplierPacks,
    );

    const result = await suppliersWithValidPack(
      mockSuppliers,
      mockPackSpecificationId,
      mockDeps,
    );

    expect(result).toEqual([mockSuppliers[0], mockSuppliers[2]]);
  });

  it("should call getSupplierPacks with correct parameters", async () => {
    (supplierConfigService.getSupplierPacks as jest.Mock).mockResolvedValue([]);

    await suppliersWithValidPack(
      mockSuppliers,
      mockPackSpecificationId,
      mockDeps,
    );

    expect(supplierConfigService.getSupplierPacks).toHaveBeenCalledWith(
      mockPackSpecificationId,
      mockDeps,
    );
  });

  it("should return empty array when no suppliers have valid packs", async () => {
    (supplierConfigService.getSupplierPacks as jest.Mock).mockResolvedValue([]);

    const result = await suppliersWithValidPack(
      mockSuppliers,
      mockPackSpecificationId,
      mockDeps,
    );

    expect(result).toEqual([]);
  });

  it("should return all suppliers when all have valid packs", async () => {
    const mockSupplierPacks = [
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-1",
      } as SupplierPack,
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-2",
      } as SupplierPack,
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-3",
      } as SupplierPack,
    ];

    (supplierConfigService.getSupplierPacks as jest.Mock).mockResolvedValue(
      mockSupplierPacks,
    );

    const result = await suppliersWithValidPack(
      mockSuppliers,
      mockPackSpecificationId,
      mockDeps,
    );

    expect(result).toEqual(mockSuppliers);
  });

  it("should handle empty suppliers array", async () => {
    const mockSupplierPacks = [
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-1",
      } as SupplierPack,
    ];

    (supplierConfigService.getSupplierPacks as jest.Mock).mockResolvedValue(
      mockSupplierPacks,
    );

    const result = await suppliersWithValidPack(
      [],
      mockPackSpecificationId,
      mockDeps,
    );

    expect(result).toEqual([]);
  });

  it("should propagate errors from getSupplierPacks", async () => {
    const error = new Error("Supplier packs service error");
    (supplierConfigService.getSupplierPacks as jest.Mock).mockRejectedValue(
      error,
    );

    await expect(
      suppliersWithValidPack(mockSuppliers, mockPackSpecificationId, mockDeps),
    ).rejects.toThrow("Supplier packs service error");
  });

  it("should filter suppliers correctly when pack specification has multiple supplier packs", async () => {
    const mockSupplierPacks = [
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-1",
      } as SupplierPack,
      {
        packSpecificationId: "pack-spec-1",
        supplierId: "supplier-2",
      } as SupplierPack,
    ];

    (supplierConfigService.getSupplierPacks as jest.Mock).mockResolvedValue(
      mockSupplierPacks,
    );

    const result = await suppliersWithValidPack(
      mockSuppliers,
      mockPackSpecificationId,
      mockDeps,
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual([mockSuppliers[0], mockSuppliers[1]]);
  });
});

describe("filterSuppliersWithCapacity", () => {
  let mockDeps: jest.Mocked<Deps>;
  let mockSuppliers: Supplier[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSuppliers = [
      {
        id: "supplier-1",
        name: "Supplier One",
        dailyCapacity: 1000,
      } as Supplier,
      {
        id: "supplier-2",
        name: "Supplier Two",
        dailyCapacity: 500,
      } as Supplier,
      {
        id: "supplier-3",
        name: "Supplier Three",
        dailyCapacity: 750,
      } as Supplier,
    ];

    mockDeps = {
      logger: { info: jest.fn(), error: jest.fn() },
      supplierQuotasRepo: {
        getDailyAllocation: jest.fn(),
      },
    } as unknown as jest.Mocked<Deps>;
  });

  it("should return suppliers with available capacity", async () => {
    const mockDailyAllocation = {
      allocations: {
        "supplier-1": 500,
        "supplier-2": 600,
        "supplier-3": 400,
      },
    };

    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(mockDailyAllocation);

    const result = await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    expect(result).toEqual([mockSuppliers[0], mockSuppliers[2]]);
  });

  it("should call getDailyAllocation with correct parameters", async () => {
    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(null);

    await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    expect(mockDeps.supplierQuotasRepo.getDailyAllocation).toHaveBeenCalledWith(
      expect.any(String),
    );
  });

  it("should return all suppliers when no daily allocation exists", async () => {
    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(null);

    const result = await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    expect(result).toEqual(mockSuppliers);
  });

  it("should handle suppliers with zero allocation", async () => {
    const mockDailyAllocation = {
      allocations: {
        "supplier-1": 0,
        "supplier-2": 450,
        "supplier-3": 700,
      },
    };

    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(mockDailyAllocation);

    const result = await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    expect(result).toEqual([
      mockSuppliers[0],
      mockSuppliers[1],
      mockSuppliers[2],
    ]);
  });

  it("should exclude suppliers at full capacity", async () => {
    const mockDailyAllocation = {
      allocations: {
        "supplier-1": 999,
        "supplier-2": 499,
        "supplier-3": 750,
      },
    };

    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(mockDailyAllocation);
    console.log(
      "Testing filterSuppliersWithCapacity with mockDailyAllocation:",
      mockDailyAllocation,
    );
    const result = await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    expect(result).toEqual([mockSuppliers[0], mockSuppliers[1]]);
  });

  it("should handle missing allocation entries for suppliers", async () => {
    const mockDailyAllocation = {
      allocations: {
        "supplier-1": 500,
      },
    };

    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(mockDailyAllocation);

    const result = await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    expect(result).toEqual(mockSuppliers);
  });

  it("should handle empty suppliers array", async () => {
    const mockDailyAllocation = {
      allocations: {
        "supplier-1": 500,
      },
    };

    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(mockDailyAllocation);

    const result = await filterSuppliersWithCapacity([], mockDeps);

    expect(result).toEqual([]);
  });

  it("should propagate errors from getDailyAllocation", async () => {
    const error = new Error("Quotas service error");
    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockRejectedValue(error);

    await expect(
      filterSuppliersWithCapacity(mockSuppliers, mockDeps),
    ).rejects.toThrow("Quotas service error");
  });

  it("should use current date in YYYY-MM-DD format for daily allocation query", async () => {
    const mockDailyAllocation = {
      allocations: {},
    };

    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(mockDailyAllocation);

    await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    const callArgs = (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mock.calls[0];
    const dateArg = callArgs[0];

    expect(dateArg).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should return suppliers where allocated capacity is less than daily capacity", async () => {
    const mockDailyAllocation = {
      allocations: {
        "supplier-1": 999,
        "supplier-2": 1,
        "supplier-3": 749,
      },
    };

    (
      mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
    ).mockResolvedValue(mockDailyAllocation);

    const result = await filterSuppliersWithCapacity(mockSuppliers, mockDeps);

    expect(result).toEqual([
      mockSuppliers[0],
      mockSuppliers[1],
      mockSuppliers[2],
    ]);
  });
});
describe("selectSupplierByFactor", () => {
  let mockDeps: jest.Mocked<Deps>;
  let mockSuppliers: Supplier[];
  let mockSupplierAllocations: SupplierAllocation[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSuppliers = [
      {
        id: "supplier-1",
        name: "Supplier One",
        dailyCapacity: 1000,
      } as Supplier,
      {
        id: "supplier-2",
        name: "Supplier Two",
        dailyCapacity: 500,
      } as Supplier,
      {
        id: "supplier-3",
        name: "Supplier Three",
        dailyCapacity: 750,
      } as Supplier,
    ];

    mockSupplierAllocations = [
      {
        id: "allocation-1",
        volumeGroup: "volume-group-1",
        supplier: "supplier-1",
        allocationPercentage: 50,
        status: "PROD",
      } as SupplierAllocation,
      {
        id: "allocation-2",
        volumeGroup: "volume-group-1",
        supplier: "supplier-2",
        allocationPercentage: 30,
        status: "PROD",
      } as SupplierAllocation,
      {
        id: "allocation-3",
        volumeGroup: "volume-group-1",
        supplier: "supplier-3",
        allocationPercentage: 20,
        status: "PROD",
      } as SupplierAllocation,
    ];

    mockDeps = {
      logger: { info: jest.fn(), error: jest.fn() },
    } as unknown as jest.Mocked<Deps>;
  });

  it("should return supplier with lowest factor", async () => {
    const mockSupplierFactors = [
      { supplierId: "supplier-1", factor: 0.5 },
      { supplierId: "supplier-2", factor: 0.2 },
      { supplierId: "supplier-3", factor: 0.8 },
    ];

    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockResolvedValue(mockSupplierFactors);

    const result = await selectSupplierByFactor(
      mockSuppliers,
      mockSupplierAllocations,
      mockDeps,
    );

    expect(result).toBe("supplier-2");
  });

  it("should return first supplier when all factors are equal", async () => {
    const mockSupplierFactors = [
      { supplierId: "supplier-1", factor: 0.5 },
      { supplierId: "supplier-2", factor: 0.5 },
      { supplierId: "supplier-3", factor: 0.5 },
    ];

    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockResolvedValue(mockSupplierFactors);

    const result = await selectSupplierByFactor(
      mockSuppliers,
      mockSupplierAllocations,
      mockDeps,
    );

    expect(result).toBe("supplier-1");
  });

  it("should handle single supplier", async () => {
    const singleSupplier = [mockSuppliers[0]];
    const singleAllocation = [mockSupplierAllocations[0]];

    const mockSupplierFactors = [{ supplierId: "supplier-1", factor: 0.5 }];

    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockResolvedValue(mockSupplierFactors);

    const result = await selectSupplierByFactor(
      singleSupplier,
      singleAllocation,
      mockDeps,
    );

    expect(result).toBe("supplier-1");
  });

  it("should select supplier with zero factor", async () => {
    const mockSupplierFactors = [
      { supplierId: "supplier-1", factor: 0.5 },
      { supplierId: "supplier-2", factor: 0 },
      { supplierId: "supplier-3", factor: 0.3 },
    ];

    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockResolvedValue(mockSupplierFactors);

    const result = await selectSupplierByFactor(
      mockSuppliers,
      mockSupplierAllocations,
      mockDeps,
    );

    expect(result).toBe("supplier-2");
  });

  it("should handle negative factors", async () => {
    const mockSupplierFactors = [
      { supplierId: "supplier-1", factor: 0.5 },
      { supplierId: "supplier-2", factor: -0.1 },
      { supplierId: "supplier-3", factor: 0.2 },
    ];

    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockResolvedValue(mockSupplierFactors);

    const result = await selectSupplierByFactor(
      mockSuppliers,
      mockSupplierAllocations,
      mockDeps,
    );

    expect(result).toBe("supplier-2");
  });

  it("should propagate errors from calculateSupplierAllocatedFactor", async () => {
    const error = new Error("Factor calculation error");
    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockRejectedValue(error);

    await expect(
      selectSupplierByFactor(mockSuppliers, mockSupplierAllocations, mockDeps),
    ).rejects.toThrow("Factor calculation error");
  });

  it("should exclude suppliers not in the suppliers list", async () => {
    const allocationsWithUnrelatedSupplier = [
      mockSupplierAllocations[0],
      {
        id: "allocation-extra",
        volumeGroup: "volume-group-1",
        supplier: "supplier-unknown",
        allocationPercentage: 5,
        status: "PROD",
      } as SupplierAllocation,
    ];

    const mockSupplierFactors = [{ supplierId: "supplier-1", factor: 0.5 }];

    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockResolvedValue(mockSupplierFactors);

    const result = await selectSupplierByFactor(
      mockSuppliers,
      allocationsWithUnrelatedSupplier,
      mockDeps,
    );

    expect(result).toBe("supplier-1");
  });

  it("should correctly identify lowest factor among many suppliers", async () => {
    const manySuppliers = Array.from(
      { length: 10 },
      (_, i) =>
        ({
          id: `supplier-${i}`,
          name: `Supplier ${i}`,
          dailyCapacity: 1000,
        }) as Supplier,
    );

    const manyAllocations = Array.from(
      { length: 10 },
      (_, i) =>
        ({
          id: `allocation-${i}`,
          volumeGroup: "volume-group-1",
          supplier: `supplier-${i}`,
          allocationPercentage: 10,
          status: "PROD",
        }) as SupplierAllocation,
    );

    const mockSupplierFactors = Array.from({ length: 10 }, (_, i) => ({
      supplierId: `supplier-${i}`,
      factor: i === 5 ? 0.1 : 0.5 + i * 0.01,
    }));

    (
      supplierQuotasService.calculateSupplierAllocatedFactor as jest.Mock
    ).mockResolvedValue(mockSupplierFactors);

    const result = await selectSupplierByFactor(
      manySuppliers,
      manyAllocations,
      mockDeps,
    );

    expect(result).toBe("supplier-5");
  });
});
