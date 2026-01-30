import { Letter } from "@internal/datastore";
import {
  mapToGetLetterResponse,
  mapToGetLettersResponse,
  mapToPatchLetterResponse,
  mapToUpdateCommands,
} from "../letter-mapper";
import {
  GetLetterResponse,
  GetLettersResponse,
  PatchLetterResponse,
  PostLettersRequest,
} from "../../contracts/letters";

describe("letter-mapper", () => {
  it("maps PostLetterRequest to UpdateLetterCommands", () => {
    const request: PostLettersRequest = {
      data: [
        {
          id: "id1",
          type: "Letter",
          attributes: {
            status: "REJECTED",
            reasonCode: "123",
            reasonText: "Reason text",
          },
        },
        { id: "id2", type: "Letter", attributes: { status: "ACCEPTED" } },
        { id: "id3", type: "Letter", attributes: { status: "DELIVERED" } },
      ],
    };
    const supplierId = "testSupplierId";
    const updateLetterCommands = mapToUpdateCommands(request, supplierId);
    expect(updateLetterCommands).toEqual([
      {
        id: "id1",
        reasonCode: "123",
        reasonText: "Reason text",
        supplierId: "testSupplierId",
        status: "REJECTED",
      },
      {
        id: "id2",
        supplierId: "testSupplierId",
        status: "ACCEPTED",
      },
      {
        id: "id3",
        supplierId: "testSupplierId",
        status: "DELIVERED",
      },
    ]);
  });

  it("maps PostLetterRequest to UpdateLetterCommands and populates statuses map", () => {
    const request: PostLettersRequest = {
      data: [
        {
          id: "id1",
          type: "Letter",
          attributes: {
            status: "REJECTED",
            reasonCode: "123",
            reasonText: "Reason text",
          },
        },
        { id: "id2", type: "Letter", attributes: { status: "ACCEPTED" } },
        { id: "id3", type: "Letter", attributes: { status: "DELIVERED" } },
      ],
    };
    const supplierId = "testSupplierId";
    const statusesMap = new Map<string, number>();
    const updateLetterCommands = mapToUpdateCommands(
      request,
      supplierId,
      statusesMap,
    );
    expect(updateLetterCommands).toEqual([
      {
        id: "id1",
        reasonCode: "123",
        reasonText: "Reason text",
        supplierId: "testSupplierId",
        status: "REJECTED",
      },
      {
        id: "id2",
        supplierId: "testSupplierId",
        status: "ACCEPTED",
      },
      {
        id: "id3",
        supplierId: "testSupplierId",
        status: "DELIVERED",
      },
    ]);
    expect(Object.fromEntries(statusesMap)).toEqual({
      REJECTED: 1,
      ACCEPTED: 1,
      DELIVERED: 1,
    });
  });

  it("maps an internal Letter to a PatchLetterResponse", () => {
    const date = new Date().toISOString();
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      billingRef: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: date,
      updatedAt: date,
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: date,
      ttl: 123,
      source: "/data-plane/letter-rendering/pdf",
      subject: "letter-rendering/source/letter/letter-id",
    };

    const result: PatchLetterResponse = mapToPatchLetterResponse(letter);

    expect(result).toEqual({
      data: {
        id: "abc123",
        type: "Letter",
        attributes: {
          specificationId: "spec123",
          status: "PENDING",
          groupId: "group123",
        },
      },
    });
  });

  it("maps an internal Letter to a PatchLetterResponse with reasonCode and reasonText when present", () => {
    const date = new Date().toISOString();
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      billingRef: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: date,
      updatedAt: date,
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: date,
      ttl: 123,
      reasonCode: "R01",
      reasonText: "Reason text",
      source: "/data-plane/letter-rendering/pdf",
      subject: "letter-rendering/source/letter/letter-id",
    };

    const result: PatchLetterResponse = mapToPatchLetterResponse(letter);

    expect(result).toEqual({
      data: {
        id: "abc123",
        type: "Letter",
        attributes: {
          specificationId: "spec123",
          status: "PENDING",
          groupId: "group123",
          reasonCode: "R01",
          reasonText: "Reason text",
        },
      },
    });
  });

  it("maps an internal Letter to a GetLetterResponse", () => {
    const date = new Date().toISOString();
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      billingRef: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: date,
      updatedAt: date,
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: date,
      ttl: 123,
      source: "/data-plane/letter-rendering/pdf",
      subject: "letter-rendering/source/letter/letter-id",
    };

    const result: GetLetterResponse = mapToGetLetterResponse(letter);

    expect(result).toEqual({
      data: {
        id: "abc123",
        type: "Letter",
        attributes: {
          specificationId: "spec123",
          status: "PENDING",
          groupId: "group123",
        },
      },
    });
  });

  it("maps an internal Letter to a GetLetterResponse with reasonCode and reasonText when present", () => {
    const date = new Date().toISOString();
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      billingRef: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: date,
      updatedAt: date,
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: date,
      ttl: 123,
      reasonCode: "R01",
      reasonText: "Reason text",
      source: "/data-plane/letter-rendering/pdf",
      subject: "letter-rendering/source/letter/letter-id",
    };

    const result: GetLetterResponse = mapToGetLetterResponse(letter);

    expect(result).toEqual({
      data: {
        id: "abc123",
        type: "Letter",
        attributes: {
          specificationId: "spec123",
          status: "PENDING",
          groupId: "group123",
          reasonCode: "R01",
          reasonText: "Reason text",
        },
      },
    });
  });

  it("maps an internal Letter collection to a GetLettersResponse", () => {
    const date = new Date().toISOString();
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      billingRef: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: date,
      updatedAt: date,
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: date,
      ttl: 123,
      reasonCode: "R01",
      reasonText: "Reason text",
      source: "/data-plane/letter-rendering/pdf",
      subject: "letter-rendering/source/letter/letter-id",
    };

    const result: GetLettersResponse = mapToGetLettersResponse([
      letter,
      letter,
    ]);

    expect(result).toEqual({
      data: [
        {
          id: "abc123",
          type: "Letter",
          attributes: {
            specificationId: "spec123",
            status: "PENDING",
            groupId: "group123",
          },
        },
        {
          id: "abc123",
          type: "Letter",
          attributes: {
            specificationId: "spec123",
            status: "PENDING",
            groupId: "group123",
          },
        },
      ],
    });
  });
});
