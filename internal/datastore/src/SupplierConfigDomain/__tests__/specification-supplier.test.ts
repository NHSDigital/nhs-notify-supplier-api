import { PackSpecification } from "./pack-specification";
import { $SupplierPack, SupplierPack } from "../supplier-pack";

describe("SpecificationSupplier schema validation", () => {
  const standardLetterSpecification: PackSpecification = {
    id: "standard-letter" as any,
    name: "Standard Economy-class Letter",
    status: "PROD",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    version: 1,
    postage: {
      id: "economy",
      size: "STANDARD",
      deliveryDays: 4,
    },
    assembly: {
      envelopeId: "nhs-economy",
      printColour: "BLACK",
    },
  };

  const testSupplierPack: SupplierPack = {
    id: "test-specification-supplier" as any,
    packSpecificationId: standardLetterSpecification.id,
    supplierId: "supplier-123",
    approval: "APPROVED",
    status: "PROD",
  };

  it("should validate a specification supplier", () => {
    expect(() => $SupplierPack.parse(testSupplierPack)).not.toThrow();
  });

  describe("approval status validation", () => {
    it("should accept DRAFT approval status", () => {
      const supplierPack = { ...testSupplierPack, approval: "DRAFT" };
      expect(() => $SupplierPack.parse(supplierPack)).not.toThrow();
    });

    it("should accept SUBMITTED approval status", () => {
      const supplierPack = { ...testSupplierPack, approval: "SUBMITTED" };
      expect(() => $SupplierPack.parse(supplierPack)).not.toThrow();
    });

    it("should accept PROOF_RECEIVED approval status", () => {
      const supplierPack = { ...testSupplierPack, approval: "PROOF_RECEIVED" };
      expect(() => $SupplierPack.parse(supplierPack)).not.toThrow();
    });

    it("should accept APPROVED approval status", () => {
      const supplierPack = { ...testSupplierPack, approval: "APPROVED" };
      expect(() => $SupplierPack.parse(supplierPack)).not.toThrow();
    });

    it("should accept REJECTED approval status", () => {
      const supplierPack = { ...testSupplierPack, approval: "REJECTED" };
      expect(() => $SupplierPack.parse(supplierPack)).not.toThrow();
    });

    it("should accept DISABLED approval status", () => {
      const supplierPack = { ...testSupplierPack, approval: "DISABLED" };
      expect(() => $SupplierPack.parse(supplierPack)).not.toThrow();
    });

    it("should reject invalid approval status", () => {
      const supplierPack = { ...testSupplierPack, approval: "INVALID_STATUS" };
      expect(() => $SupplierPack.parse(supplierPack)).toThrow();
    });
  });
});
