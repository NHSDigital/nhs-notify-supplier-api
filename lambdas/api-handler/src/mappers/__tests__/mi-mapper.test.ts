import { MIBase } from "@internal/datastore/src";
import { IncomingMI, PostMIRequest } from "../../contracts/mi";
import { mapToMI, mapToPostMIResponse } from "../mi-mapper";

describe("mi-mapper", () => {
  it("maps a PostMIRequest to an IncomingMI object", async () => {
    const postMIRequest: PostMIRequest = {
      data: {
        type: "ManagementInformation",
        attributes: {
          lineItem: "envelope-business-standard",
          timestamp: "2023-11-17T14:27:51.413Z",
          quantity: 22,
          specificationId: "spec1",
          groupId: "group1",
          stockRemaining: 20_000,
        },
      },
    };

    const result: IncomingMI = mapToMI(postMIRequest, "supplier1");

    expect(result).toEqual({
      lineItem: "envelope-business-standard",
      timestamp: "2023-11-17T14:27:51.413Z",
      quantity: 22,
      specificationId: "spec1",
      groupId: "group1",
      stockRemaining: 20_000,
      supplierId: "supplier1",
    });
  });

  it("maps an internal MIBase object to a PostMIResponse", async () => {
    const mi: MIBase = {
      id: "id1",
      lineItem: "envelope-business-standard",
      timestamp: "2023-11-17T14:27:51.413Z",
      quantity: 22,
      specificationId: "spec1",
      groupId: "group1",
      stockRemaining: 20_000,
    };

    const result = mapToPostMIResponse(mi);

    expect(result).toEqual({
      data: {
        id: "id1",
        type: "ManagementInformation",
        attributes: {
          lineItem: "envelope-business-standard",
          timestamp: "2023-11-17T14:27:51.413Z",
          quantity: 22,
          specificationId: "spec1",
          groupId: "group1",
          stockRemaining: 20_000,
        },
      },
    });
  });
});
