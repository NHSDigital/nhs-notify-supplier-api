import { DailyAllocation, OverallAllocation } from "@internal/datastore";
import { SupplierAllocation } from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { Deps } from "../../config/deps";
import {
  calculateSupplierAllocatedFactor,
  updateSupplierAllocation,
} from "../supplier-quotas";

describe("supplier-quotas", () => {
  let mockDeps: jest.Mocked<Deps>;

  beforeEach(() => {
    mockDeps = {
      supplierQuotasRepo: {
        getOverallAllocation: jest.fn(),
        updateOverallAllocation: jest.fn(),
        putOverallAllocation: jest.fn(),
        getDailyAllocation: jest.fn(),
        updateDailyAllocation: jest.fn(),
        putDailyAllocation: jest.fn(),
      } as any,
      logger: {
        info: jest.fn(),
      } as any,
    } as jest.Mocked<Deps>;
  });

  describe("calculateSupplierAllocatedFactor", () => {
    it("should return factor 0 when no overall allocation exists", async () => {
      const supplierAllocations: SupplierAllocation[] = [
        {
          supplier: "supplier1",
          volumeGroup: "vg1",
          allocationPercentage: 50,
        } as SupplierAllocation,
      ];

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(null);

      const result = await calculateSupplierAllocatedFactor(
        supplierAllocations,
        mockDeps,
      );

      expect(result).toEqual([{ supplierId: "supplier1", factor: 0 }]);
    });

    it("should calculate correct factor when overall allocation exists", async () => {
      const supplierAllocations: SupplierAllocation[] = [
        {
          supplier: "supplier1",
          volumeGroup: "vg1",
          allocationPercentage: 50,
        } as SupplierAllocation,
      ];

      const overallAllocation: OverallAllocation = {
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 100,
        },
      };

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(overallAllocation);

      const result = await calculateSupplierAllocatedFactor(
        supplierAllocations,
        mockDeps,
      );

      expect(result).toEqual([{ supplierId: "supplier1", factor: 2 }]);
    });

    it("should handle multiple suppliers with different allocations", async () => {
      const supplierAllocations: SupplierAllocation[] = [
        {
          supplier: "supplier1",
          volumeGroup: "vg1",
          allocationPercentage: 50,
        } as SupplierAllocation,
        {
          supplier: "supplier2",
          volumeGroup: "vg1",
          allocationPercentage: 50,
        } as SupplierAllocation,
      ];

      const overallAllocation: OverallAllocation = {
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 60,
          supplier2: 40,
        },
      };

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(overallAllocation);

      const result = await calculateSupplierAllocatedFactor(
        supplierAllocations,
        mockDeps,
      );

      expect(result).toEqual([
        { supplierId: "supplier1", factor: 1.2 },
        { supplierId: "supplier2", factor: 0.8 },
      ]);
    });

    it("should handle supplier not in allocations map with factor 0", async () => {
      const supplierAllocations: SupplierAllocation[] = [
        {
          supplier: "supplier3",
          volumeGroup: "vg1",
          allocationPercentage: 50,
        } as SupplierAllocation,
      ];

      const overallAllocation: OverallAllocation = {
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 100,
        },
      };

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(overallAllocation);

      const result = await calculateSupplierAllocatedFactor(
        supplierAllocations,
        mockDeps,
      );

      expect(result).toEqual([{ supplierId: "supplier3", factor: 0 }]);
    });

    it("should return factor 0 when total allocation is 0", async () => {
      const supplierAllocations: SupplierAllocation[] = [
        {
          supplier: "supplier1",
          volumeGroup: "vg1",
          allocationPercentage: 50,
        } as SupplierAllocation,
      ];

      const overallAllocation: OverallAllocation = {
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 0,
        },
      };

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(overallAllocation);

      const result = await calculateSupplierAllocatedFactor(
        supplierAllocations,
        mockDeps,
      );

      expect(result).toEqual([{ supplierId: "supplier1", factor: 0 }]);
    });
  });

  describe("updateSupplierAllocation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-15T10:30:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should update existing overall allocation and daily allocation", async () => {
      const existingOverallAllocation: OverallAllocation = {
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 100,
        },
      };

      const existingDailyAllocation: DailyAllocation = {
        id: "vg1#DATE#2024-01-15",
        date: "2024-01-15",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 100,
        },
      };

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(existingOverallAllocation);
      (
        mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
      ).mockResolvedValue(existingDailyAllocation);

      await updateSupplierAllocation("vg1", "supplier1", 150, mockDeps);

      expect(
        mockDeps.supplierQuotasRepo.updateOverallAllocation,
      ).toHaveBeenCalledWith("vg1", "supplier1", 150);
      expect(
        mockDeps.supplierQuotasRepo.updateDailyAllocation,
      ).toHaveBeenCalledWith("vg1", "2024-01-15", "supplier1", 150);
    });

    it("should create new overall allocation when none exists", async () => {
      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(null);
      (
        mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
      ).mockResolvedValue(null);

      await updateSupplierAllocation("vg1", "supplier1", 100, mockDeps);

      expect(
        mockDeps.supplierQuotasRepo.putOverallAllocation,
      ).toHaveBeenCalledWith({
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 100,
        },
      });
    });

    it("should create new daily allocation when none exists", async () => {
      const existingOverallAllocation: OverallAllocation = {
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 100,
        },
      };

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(existingOverallAllocation);
      (
        mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
      ).mockResolvedValue(null);

      await updateSupplierAllocation("vg1", "supplier1", 150, mockDeps);

      expect(
        mockDeps.supplierQuotasRepo.putDailyAllocation,
      ).toHaveBeenCalledWith({
        id: "vg1#DATE#2024-01-15",
        date: "2024-01-15",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 150,
        },
      });
    });

    it("should log when updating existing overall allocation", async () => {
      const existingOverallAllocation: OverallAllocation = {
        id: "vg1",
        volumeGroup: "vg1",
        allocations: {
          supplier1: 100,
        },
      };

      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(existingOverallAllocation);
      (
        mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
      ).mockResolvedValue(null);

      await updateSupplierAllocation("vg1", "supplier1", 150, mockDeps);

      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Existing overall allocation found for volume group",
          volumeGroupId: "vg1",
        }),
      );
    });

    it("should log when creating new overall allocation", async () => {
      (
        mockDeps.supplierQuotasRepo.getOverallAllocation as jest.Mock
      ).mockResolvedValue(null);
      (
        mockDeps.supplierQuotasRepo.getDailyAllocation as jest.Mock
      ).mockResolvedValue(null);

      await updateSupplierAllocation("vg1", "supplier1", 100, mockDeps);

      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          description:
            "No overall allocation found for volume group, creating new one",
          volumeGroupId: "vg1",
        }),
      );
    });
  });
});
