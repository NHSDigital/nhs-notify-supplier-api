import {
  $MI,
  MI,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/domain/mi";

describe("MI schema validation", () => {
  const validMIEvent: MI = {
    id: "mi-001",
    lineItem: "LETTER_PRINT_A4",
    timestamp: "2025-11-16T10:30:00.000Z",
    quantity: 150,
    specificationId: "spec-123",
    groupId: "group-456",
    stockRemaining: 1000,
    supplierId: "supplier-789",
    createdAt: "2025-11-16T10:30:00.000Z",
    updatedAt: "2025-11-16T10:30:00.000Z",
  };

  describe("basic validation", () => {
    it("should validate a valid MI event with all fields", () => {
      const result = $MI.safeParse(validMIEvent);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(validMIEvent);
    });

    it("should validate an MI event without optional fields", () => {
      const minimalMI = {
        id: "mi-002",
        lineItem: "LETTER_PRINT_A5",
        timestamp: "2025-11-16T11:00:00.000Z",
        quantity: 75,
        supplierId: "supplier-101",
        createdAt: "2025-11-16T11:00:00.000Z",
        updatedAt: "2025-11-16T11:00:00.000Z",
      };

      const result = $MI.safeParse(minimalMI);
      expect(result.success).toBe(true);
      const data = result.data as MI;
      expect(data.specificationId).toBeUndefined();
      expect(data.groupId).toBeUndefined();
      expect(data.stockRemaining).toBeUndefined();
    });
  });

  describe("field validation", () => {
    it("should reject MI event missing required field 'id'", () => {
      const invalidMI = { ...validMIEvent };
      delete (invalidMI as any).id;

      const result = $MI.safeParse(invalidMI);
      expect(result.success).toBe(false);
    });

    it("should reject MI event missing required field 'lineItem'", () => {
      const invalidMI = { ...validMIEvent };
      delete (invalidMI as any).lineItem;

      const result = $MI.safeParse(invalidMI);
      expect(result.success).toBe(false);
    });

    it("should reject MI event missing required field 'timestamp'", () => {
      const invalidMI = { ...validMIEvent };
      delete (invalidMI as any).timestamp;

      const result = $MI.safeParse(invalidMI);
      expect(result.success).toBe(false);
    });

    it("should reject MI event missing required field 'quantity'", () => {
      const invalidMI = { ...validMIEvent };
      delete (invalidMI as any).quantity;

      const result = $MI.safeParse(invalidMI);
      expect(result.success).toBe(false);
    });

    it("should reject MI event missing required field 'supplierId'", () => {
      const invalidMI = { ...validMIEvent };
      delete (invalidMI as any).supplierId;

      const result = $MI.safeParse(invalidMI);
      expect(result.success).toBe(false);
    });

    it("should reject MI event with invalid quantity type", () => {
      const invalidMI = {
        ...validMIEvent,
        quantity: "not-a-number",
      };

      const result = $MI.safeParse(invalidMI);
      expect(result.success).toBe(false);
    });

    it("should reject MI event with invalid stockRemaining type", () => {
      const invalidMI = {
        ...validMIEvent,
        stockRemaining: "not-a-number",
      };

      const result = $MI.safeParse(invalidMI);
      expect(result.success).toBe(false);
    });
  });

  describe("testData examples", () => {
    it("should parse a letter print MI event", () => {
      const letterPrintMI = {
        id: "mi-letter-001",
        lineItem: "LETTER_PRINT_A4_COLOR",
        timestamp: "2025-11-16T14:00:00.000Z",
        quantity: 250,
        specificationId: "letter-spec-001",
        groupId: "batch-001",
        supplierId: "supplier-abc",
        createdAt: "2025-11-16T14:00:00.000Z",
        updatedAt: "2025-11-16T14:00:00.000Z",
      };

      const result = $MI.safeParse(letterPrintMI);
      expect(result.success).toBe(true);
    });

    it("should parse an envelope usage MI event", () => {
      const envelopeMI = {
        id: "mi-envelope-001",
        lineItem: "ENVELOPE_DL",
        timestamp: "2025-11-16T15:00:00.000Z",
        quantity: 300,
        stockRemaining: 2500,
        supplierId: "supplier-xyz",
        createdAt: "2025-11-16T15:00:00.000Z",
        updatedAt: "2025-11-16T15:00:00.000Z",
      };

      const result = $MI.safeParse(envelopeMI);
      expect(result.success).toBe(true);
      const data = result.data as MI;
      expect(data.stockRemaining).toBe(2500);
    });

    it("should parse a postage MI event", () => {
      const postageMI = {
        id: "mi-postage-001",
        lineItem: "POSTAGE_FIRST_CLASS",
        timestamp: "2025-11-16T16:00:00.000Z",
        quantity: 500,
        groupId: "daily-batch-16-11-2025",
        supplierId: "supplier-123",
        createdAt: "2025-11-16T16:00:00.000Z",
        updatedAt: "2025-11-16T16:00:00.000Z",
      };

      const result = $MI.safeParse(postageMI);
      expect(result.success).toBe(true);
      const data = result.data as MI;
      expect(data.lineItem).toBe("POSTAGE_FIRST_CLASS");
      expect(data.groupId).toBe("daily-batch-16-11-2025");
    });
  });
});
