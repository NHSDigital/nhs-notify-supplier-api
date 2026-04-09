import MiNotFoundError from "@internal/datastore/src/errors/mi-not-found-error";
import { IncomingMI } from "../../contracts/mi";
import { getMI, postMI } from "../mi-operations";

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

describe("getMI function", () => {
  const incomingMi: IncomingMI = {
    lineItem: "envelope-business-standard",
    timestamp: "2023-11-17T14:27:51.413Z",
    quantity: 22,
    specificationId: "spec1",
    groupId: "group1",
    stockRemaining: 20_000,
    supplierId: "supplier1",
  };
  it("retrieves the MI from the repository", async () => {
    const persistedMi = { id: "id1", ...incomingMi };

    const mockRepo = {
      getMI: jest.fn().mockResolvedValue(persistedMi),
    };

    const result = await getMI("id1", "supplier1", mockRepo as any);

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

  it("should throw notFoundError when letter does not exist", async () => {
    const mockRepo = {
      getMI: jest
        .fn()
        .mockRejectedValue(new MiNotFoundError("supplier1", "miId1")),
    };

    await expect(getMI("miId1", "supplier1", mockRepo as any)).rejects.toThrow(
      "No resource found with that ID",
    );
  });

  it("should throw unexpected error", async () => {
    const mockRepo = {
      getMI: jest.fn().mockRejectedValue(new Error("unexpected error")),
    };

    await expect(getMI("miId1", "supplier1", mockRepo as any)).rejects.toThrow(
      "unexpected error",
    );
  });
});
