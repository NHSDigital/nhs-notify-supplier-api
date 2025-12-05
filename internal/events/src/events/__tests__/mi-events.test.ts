import fs from "node:fs";
import path from "node:path";
import { $MISubmittedEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/mi-events";

function readJson(filename: string): unknown {
  const filePath = path.resolve(__dirname, "./testData/", filename);

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

describe("MI event validations", () => {
  it("should parse mi.submitted event successfully", () => {
    const json = readJson("mi.submitted.json");

    const { data: event, error } = $MISubmittedEvent.safeParse(json);
    expect(error).toBeUndefined();
    expect(event).toBeDefined();
    expect(event).toEqual(
      expect.objectContaining({
        type: "uk.nhs.notify.supplier-api.mi.submitted.v1",
        specversion: "1.0",
        source: "/data-plane/supplier-api/prod/submit-mi",
        id: "8f2c3b44-4e65-5b1b-a678-1f0bf3d4d222",
        time: "2025-11-16T10:30:00.000Z",
        datacontenttype: "application/json",
        dataschema:
          "https://notify.nhs.uk/cloudevents/schemas/supplier-api/mi.submitted.1.0.0.schema.json",
        subject: "mi/mi-test-001",
        data: expect.objectContaining({
          id: "mi-test-001",
          lineItem: "LETTER_PRINT_A4",
          timestamp: "2025-11-16T10:30:00.000Z",
          quantity: 150,
          specificationId: "spec-123",
          groupId: "group-456",
          stockRemaining: 1000,
          supplierId: "supplier-789",
        }),
      }),
    );
  });

  it("should parse minimal mi.submitted event successfully", () => {
    const json = readJson("mi.submitted-minimal.json");

    const event = $MISubmittedEvent.parse(json);
    expect(event).toBeDefined();
    expect(event.data).toEqual(
      expect.objectContaining({
        id: "mi-envelope-001",
        lineItem: "ENVELOPE_DL",
        quantity: 300,
        stockRemaining: 2500,
        supplierId: "supplier-xyz",
      }),
    );
    expect(event.data.specificationId).toBeUndefined();
    expect(event.data.groupId).toBeUndefined();
  });

  it("should parse MI data fields correctly", () => {
    const json = readJson("mi.submitted.json");

    const event = $MISubmittedEvent.parse(json);
    expect(event).toBeDefined();
    expect(event.data.id).toBe("mi-test-001");
    expect(event.data.lineItem).toBe("LETTER_PRINT_A4");
    expect(event.data.quantity).toBe(150);
    expect(event.data.stockRemaining).toBe(1000);
    expect(event.data.supplierId).toBe("supplier-789");
    expect(event.data.specificationId).toBe("spec-123");
    expect(event.data.groupId).toBe("group-456");
  });

  it("should throw error for mi.submitted event with missing subject", () => {
    const json = readJson("mi.submitted-with-missing-subject.json");

    expect(() => $MISubmittedEvent.parse(json)).toThrow("subject");
  });

  it("should throw error for mi.submitted event with invalid major schema version", () => {
    const json = readJson("mi.submitted-with-invalid-major-version.json");

    expect(() => $MISubmittedEvent.parse(json)).toThrow("dataschema");
  });
});
