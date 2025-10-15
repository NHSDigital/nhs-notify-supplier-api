import fs from "node:fs";
import path from "node:path";
import { letterStatusChangeEventsMap } from "../letter-status-change-events";

function readJson(filename: string): unknown {
  const filePath = path.resolve(__dirname, "./testData/", filename);

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

describe("LetterStatus event validations", () => {
  it("should validate a LetterStatus.ACCEPTED event with all required fields", () => {
    const json = readJson("letter-status.ACCEPTED-valid.json");

    const event = letterStatusChangeEventsMap['letter-status.ACCEPTED'].parse(json);
    expect(event).toBeDefined();
    expect(event.type).toBe(
      "uk.nhs.notify.supplier-api.letter-status.ACCEPTED.v1",
    );
    expect(event.specversion).toBe("1.0");
    expect(event.source).toBe("/data-plane/supplier-api/prod/update-status");
    expect(event.id).toBe("23f1f09c-a555-4d9b-8405-0b33490bc920");
    expect(event.time).toBe("2025-08-28T08:45:00.000Z");
    expect(event.datacontenttype).toBe("application/json");
    expect(event.dataschema).toBe(
      "https://notify.nhs.uk/events/supplier-api/letter-status/ACCEPTED/1.0.0.json",
    );
    expect(event.dataschemaversion).toBe("1.0.0");
    expect(event.data).toBeDefined();
    expect(event.data.sourceSubject).toBe("some-subject");
    expect(event.data.status).toBe("ACCEPTED");
    expect(event.data.reasonCode).toBeUndefined();
    expect(event.data.reasonText).toBeUndefined();
  });

  it("should throw error for letter-status.ACCEPTED event with missing sourceSubject", () => {
    const json = readJson("letter-status.ACCEPTED-with-missing-fields.json");

    expect(() => letterStatusChangeEventsMap['letter-status.ACCEPTED'].parse(json)).toThrow(
      "sourceSubject",
    );
  });

  it("should throw error for letter-status.ACCEPTED event with invalid major schema version", () => {
    const json = readJson(
      "letter-status.ACCEPTED-with-invalid-major-version.json",
    );

    expect(() => letterStatusChangeEventsMap['letter-status.ACCEPTED'].parse(json)).toThrow(
      "dataschemaversion",
    );
  });
});
