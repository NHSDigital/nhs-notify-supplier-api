import fs from "node:fs";
import path from "node:path";
import { letterEventMap } from "../letter-events";

function readJson(filename: string): unknown {
  const filePath = path.resolve(__dirname, "./testData/", filename);

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

describe("LetterStatus event validations", () => {
  it("should validate a LetterStatus.ACCEPTED event with all required fields", () => {
    const json = readJson("letter.ACCEPTED-valid.json");

    const event = letterEventMap['letter.ACCEPTED'].parse(json);

    expect(event).toBeDefined();
    expect(event).toEqual(
      expect.objectContaining({
        type: "uk.nhs.notify.supplier-api.letter.ACCEPTED.v1",
        specversion: "1.0",
        source: "/data-plane/supplier-api/prod/update-status",
        id: "23f1f09c-a555-4d9b-8405-0b33490bc920",
        time: "2025-08-28T08:45:00.000Z",
        datacontenttype: "application/json",
        dataschema: "https://notify.nhs.uk/events/supplier-api/letter/ACCEPTED/1.0.0.json",
        dataschemaversion: "1.0.0",
        subject: "customer/letter-renderer/supplier-api/letter/f47ac10b-58cc-4372-a567-0e02b2c3d479",
        data: expect.objectContaining({
          origin: expect.objectContaining({
            source: "/data-plane/letter-rendering/prod/render-pdf",
            subject: "customer/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-rendering/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
          }),
          status: "ACCEPTED"
        })
      })
    );
  });

  it("should throw error for letter.ACCEPTED event with missing sourceSubject", () => {
    const json = readJson("letter.ACCEPTED-with-missing-fields.json");

    expect(() => letterEventMap['letter.ACCEPTED'].parse(json)).toThrow(
      "source",
    );
  });

  it("should throw error for letter.ACCEPTED event with invalid major schema version", () => {
    const json = readJson(
      "letter.ACCEPTED-with-invalid-major-version.json",
    );

    expect(() => letterEventMap['letter.ACCEPTED'].parse(json)).toThrow(
      "dataschemaversion",
    );
  });
});
