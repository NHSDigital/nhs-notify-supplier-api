import { $LetterEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { Letter } from "@internal/datastore";
import mapLetterToCloudEvent from "../letter-mapper";

describe("letter-mapper", () => {
  it("maps a letter to a letter event", async () => {
    const letter = {
      id: "id1",
      specificationId: "spec1",
      supplierId: "supplier1",
      groupId: "group1",
      status: "PRINTED",
      reasonCode: "R02",
      reasonText: "Reason text",
      updatedAt: "2025-11-24T15:55:18.000Z",
    } as Letter;
    const event = mapLetterToCloudEvent(letter);

    // Check it conforms to the letter event schema - parse will throw an error if not
    $LetterEvent.parse(event);
    expect(event.type).toBe("uk.nhs.notify.supplier-api.letter.PRINTED.v1");
    expect(event.dataschema).toBe(
      `https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.PRINTED.${event.dataschemaversion}.schema.json`
    );
    expect(event.dataschemaversion).toBe("1.0.6");
    expect(event.subject).toBe("letter-origin/supplier-api/letter/id1");
    expect(event.time).toBe("2025-11-24T15:55:18.000Z");
    expect(event.recordedtime).toBe("2025-11-24T15:55:18.000Z");
    expect(event.data).toEqual({
      domainId: "id1",
      status: "PRINTED",
      specificationId: "spec1",
      supplierId: "supplier1",
      groupId: "group1",
      reasonCode: "R02",
      reasonText: "Reason text",
      origin: {
        domain: "supplier-api",
        source: "/data-plane/supplier-api/letters",
        subject: "letter-origin/supplier-api/letter/id1",
        event: event.id,
      },
    });
  });
});
