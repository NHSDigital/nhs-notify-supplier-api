import { IncomingMI } from "../../contracts/mi";
import postMI from "../mi-operations";

describe("postMI function", () => {
  const incomingMi: IncomingMI = {
    lineItem: "envelope-business-standard",
    timestamp: "2023-11-17T14:27:51.413Z",
    quantity: 22,
    specificationId: "spec1",
    groupId: "group1",
    stockRemaining: 20_000,
    supplierId: "supplier1",
  };

  it("creates the MI in the repository", async () => {
    const persistedMi = { id: "id1", ...incomingMi };

    const mockRepo = {
      putMI: jest.fn().mockResolvedValue(persistedMi),
    };

    const result = await postMI(incomingMi, mockRepo as any);

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
