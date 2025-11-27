import { Letter } from "@internal/datastore";
import {
  mapToGetLetterResponse,
  mapToGetLettersResponse,
  mapToPatchLetterResponse,
} from "../letter-mapper";
import {
  GetLetterResponse,
  GetLettersResponse,
  PatchLetterResponse,
} from "../../contracts/letters";

describe("letter-mapper", () => {
  it("maps an internal Letter to a PatchLetterResponse", () => {
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
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
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
      reasonCode: "R01",
      reasonText: "Reason text",
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
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
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
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
      reasonCode: "R01",
      reasonText: "Reason text",
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
    const letter: Letter = {
      id: "abc123",
      status: "PENDING",
      supplierId: "supplier1",
      specificationId: "spec123",
      groupId: "group123",
      url: "https://example.com/letter/abc123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: "supplier1#PENDING",
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
      reasonCode: "R01",
      reasonText: "Reason text",
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
