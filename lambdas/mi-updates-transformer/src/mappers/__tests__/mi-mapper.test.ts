import { $MISubmittedEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { MI } from "@internal/datastore";
import mapMIToCloudEvent from "../mi-mapper";

describe("mi-mapper", () => {
  it("maps an MI to an MI event", async () => {
    const mi: MI = {
      id: "id1",
      lineItem: "lineItem1",
      timestamp: "2025-11-24T15:55:18Z",
      quantity: 100,
      supplierId: "supplier1",
      createdAt: "2025-11-24T15:55:18Z",
      updatedAt: "2025-11-24T15:55:18Z",
      ttl: 1_735_687_518,
      specificationId: "spec1",
      groupId: "group1",
      stockRemaining: 500,
    };
    jest.useFakeTimers().setSystemTime(new Date("2025-11-24T15:55:18Z"));
    const event = mapMIToCloudEvent(mi);

    // Check it conforms to the MI event schema - parse will throw an error if not
    $MISubmittedEvent.parse(event);
    expect(event.type).toBe("uk.nhs.notify.supplier-api.mi.SUBMITTED.v1");
    expect(event.dataschema).toBe(
      "https://notify.nhs.uk/cloudevents/schemas/supplier-api/mi.SUBMITTED.1.0.0.schema.json",
    );
    expect(event.subject).toBe("mi/id1");
    expect(event.time).toBe("2025-11-24T15:55:18.000Z");
    expect(event.recordedtime).toBe("2025-11-24T15:55:18.000Z");
    expect(event.data).toEqual({
      id: "id1",
      lineItem: "lineItem1",
      timestamp: "2025-11-24T15:55:18Z",
      quantity: 100,
      specificationId: "spec1",
      groupId: "group1",
      stockRemaining: 500,
      supplierId: "supplier1",
      createdAt: "2025-11-24T15:55:18Z",
      updatedAt: "2025-11-24T15:55:18Z",
    });

    jest.useRealTimers();
  });
});
