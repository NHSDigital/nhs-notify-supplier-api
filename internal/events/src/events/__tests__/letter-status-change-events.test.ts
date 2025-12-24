import fs from "node:fs";
import path from "node:path";
import { letterEventMap } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";

function readJson(filename: string): unknown {
  const filePath = path.resolve(__dirname, "./testData/", filename);

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

describe("LetterStatus event validations", () => {
  it.each(["ACCEPTED", "FORWARDED", "RETURNED"])(
    "should parse %s letter statuses successfully",
    (status) => {
      const json = readJson(`letter.${status}.json`);

      const { data: event, error } =
        letterEventMap[`letter.${status}`].safeParse(json);
      expect(error).toBeUndefined();
      expect(event).toBeDefined();
      expect(event).toEqual(
        expect.objectContaining({
          type: `uk.nhs.notify.supplier-api.letter.${status}.v1`,
          specversion: "1.0",
          source: "/data-plane/supplier-api/prod/update-status",
          id: "23f1f09c-a555-4d9b-8405-0b33490bc920",
          time: "2025-08-28T08:45:00.000Z",
          datacontenttype: "application/json",
          dataschema: `https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.${status}.1.0.0.schema.json`,
          subject:
            "letter-origin/letter-rendering/letter/f47ac10b-58cc-4372-a567-0e02b2c3d479",
          data: expect.objectContaining({
            origin: expect.objectContaining({
              subject:
                "client/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
              event: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            }),
            domainId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            specificationId: "1y3q9v1zzzz",
            billingRef: "1y3q9v1zzzz",
            groupId: "client_template",
            status,
          }),
        }),
      );
    },
  );

  it("should parse reason code and text correctly for returned mail", () => {
    const json = readJson("letter.RETURNED.json");

    const event = letterEventMap["letter.RETURNED"].parse(json);
    expect(event).toBeDefined();
    expect(event.data).toEqual(
      expect.objectContaining({
        reasonCode: "R07",
        reasonText: "No such address",
      }),
    );
  });

  it("should parse reason code and text correctly for forwarded mail", () => {
    const json = readJson("letter.FORWARDED.json");

    const event = letterEventMap["letter.FORWARDED"].parse(json);
    expect(event).toBeDefined();
    expect(event.data).toEqual(
      expect.objectContaining({
        reasonCode: "RNIB",
        reasonText: "RNIB",
      }),
    );
  });

  it("should throw error for letter.ACCEPTED event with missing sourceSubject", () => {
    const json = readJson("letter.ACCEPTED-with-missing-fields.json");

    expect(() => letterEventMap["letter.ACCEPTED"].parse(json)).toThrow(
      "subject",
    );
  });

  it("should throw error for letter.ACCEPTED event with invalid major schema version", () => {
    const json = readJson("letter.ACCEPTED-with-invalid-major-version.json");

    expect(() => letterEventMap["letter.ACCEPTED"].parse(json)).toThrow(
      "dataschema",
    );
  });
});
