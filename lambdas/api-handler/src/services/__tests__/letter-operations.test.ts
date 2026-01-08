import { Letter, LetterRepository } from "@internal/datastore";
import pino from "pino";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import {
  enqueueLetterUpdateRequests,
  getLetterById,
  getLetterDataUrl,
  getLettersForSupplier,
} from "../letter-operations";
import { LetterDto } from "../../contracts/letters";
import { Deps } from "../../config/deps";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock("@aws-sdk/client-s3", () => {
  jest.requireActual("@aws-sdk/client-s3");
  return {
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  };
});

function makeLetter(id: string, status: Letter["status"]): Letter {
  return {
    id,
    status,
    supplierId: "supplier1",
    specificationId: "spec123",
    groupId: "group123",
    url: `s3://letterDataBucket/${id}.pdf`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    supplierStatus: `supplier1#${status}`,
    supplierStatusSk: Date.now().toString(),
    ttl: 123,
    reasonCode: "R01",
    reasonText: "Reason text",
  };
}

describe("getLetterIdsForSupplier", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns letter IDs from the repository", async () => {
    const mockRepo = {
      getLettersBySupplier: jest.fn().mockResolvedValue([
        { id: "id1", status: "PENDING", specificationId: "s1" },
        { id: "id2", status: "PENDING", specificationId: "s1" },
      ]),
    };

    const result = await getLettersForSupplier(
      "supplier1",
      "PENDING",
      10,
      mockRepo as any,
    );

    expect(mockRepo.getLettersBySupplier).toHaveBeenCalledWith(
      "supplier1",
      "PENDING",
      10,
    );
    expect(result).toEqual([
      { id: "id1", status: "PENDING", specificationId: "s1" },
      { id: "id2", status: "PENDING", specificationId: "s1" },
    ]);
  });
});

describe("getLetterById", () => {
  const testLetter = {
    id: "id1",
    status: "PENDING",
    specificationId: "s1",
    groupId: "g1",
  };

  it("returns letter from the repository", async () => {
    const mockRepo = {
      getLetterById: jest.fn().mockResolvedValue(testLetter),
    };

    const result = await getLetterById("supplier1", "id1", mockRepo as any);

    expect(mockRepo.getLetterById).toHaveBeenCalledWith("supplier1", "id1");
    expect(result).toEqual({
      id: "id1",
      status: "PENDING",
      specificationId: "s1",
      groupId: "g1",
    });
  });

  it("should throw notFoundError when letter does not exist", async () => {
    const mockRepo = {
      getLetterById: jest
        .fn()
        .mockRejectedValue(
          new Error("Letter with id l1 not found for supplier s1"),
        ),
    };

    await expect(
      getLetterById("supplierid", "letter1", mockRepo as any),
    ).rejects.toThrow("No resource found with that ID");
  });

  it("should throw unexpected error", async () => {
    const mockRepo = {
      getLetterById: jest.fn().mockRejectedValue(new Error("unexpected error")),
    };

    await expect(
      getLetterById("supplierid", "letter1", mockRepo as any),
    ).rejects.toThrow("unexpected error");
  });
});

describe("getLetterDataUrl function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<
    typeof getSignedUrl
  >;

  const updatedLetter = makeLetter("letter1", "REJECTED");

  const s3Client = { send: jest.fn() } as unknown as S3Client;
  const letterRepo = {
    getLetterById: jest.fn().mockResolvedValue(updatedLetter),
  } as unknown as LetterRepository;
  const logger = jest.fn() as unknown as pino.Logger;
  const env = {
    LETTERS_TABLE_NAME: "LettersTable",
    LETTER_TTL_HOURS: 12_960,
    SUPPLIER_ID_HEADER: "nhsd-supplier-id",
    APIM_CORRELATION_HEADER: "nhsd-correlation-id",
    DOWNLOAD_URL_TTL_SECONDS: 60,
  };
  const deps: Deps = { s3Client, letterRepo, logger, env } as Deps;

  it("should return pre signed url successfully", async () => {
    mockedGetSignedUrl.mockResolvedValue("https://somePreSignedUrl.com");

    const result = await getLetterDataUrl("supplier1", "letter1", deps);

    const expectedCommandInput = {
      Bucket: "letterDataBucket",
      Key: "letter1.pdf",
    };
    expect(mockedGetSignedUrl).toHaveBeenCalledWith(
      s3Client,
      { input: expectedCommandInput },
      { expiresIn: 60 },
    );
    expect(result).toEqual("https://somePreSignedUrl.com");
  });

  it("should throw notFoundError when letter does not exist", async () => {
    deps.letterRepo = {
      getLetterById: jest
        .fn()
        .mockRejectedValue(
          new Error("Letter with id l1 not found for supplier s1"),
        ),
    } as unknown as LetterRepository;

    await expect(
      getLetterDataUrl("supplier1", "letter42", deps),
    ).rejects.toThrow("No resource found with that ID");
  });

  it("should throw unexpected error", async () => {
    deps.letterRepo = {
      getLetterById: jest.fn().mockRejectedValue(new Error("unexpected error")),
    } as unknown as LetterRepository;

    await expect(
      getLetterDataUrl("supplier1", "letter1", deps),
    ).rejects.toThrow("unexpected error");
  });
});

function makeLetterDto(n: number): LetterDto {
  return {
    id: `letter${n}`,
    status: "PENDING",
    supplierId: `testSupplier}`,
  };
}

describe("enqueueLetterUpdateRequests function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update the letter status successfully", async () => {
    const sqsClient = { send: jest.fn() } as unknown as SQSClient;
    const logger = { error: jest.fn() } as unknown as pino.Logger;
    const env = {
      QUEUE_URL: "sqsUrl",
    };
    const deps: Deps = { sqsClient, logger, env } as Deps;

    const lettersToUpdate = Array.from({ length: 25 }, (_, i) =>
      makeLetterDto(i),
    );

    const sqsClientSendMock = sqsClient.send as jest.Mock;
    sqsClientSendMock.mockResolvedValue({ Failed: [] });

    const result = await enqueueLetterUpdateRequests(
      lettersToUpdate,
      "correlationId1",
      deps,
    );

    expect(result).toBeUndefined();

    // processes 10 at a time (25 -> 10+10+5)
    expect(sqsClientSendMock).toHaveBeenCalledTimes(3);

    const firstCallArg = sqsClientSendMock.mock.calls[0][0];
    const firstInput = firstCallArg.input;

    expect(firstInput.QueueUrl).toBe(deps.env.QUEUE_URL);
    expect(Array.isArray(firstInput.Entries)).toBe(true);
    expect(firstInput.Entries.length).toBe(10);

    expect(firstInput.Entries[0].Id).toBe("0-0");
    expect(firstInput.Entries[9].Id).toBe("0-9");

    expect(
      firstInput.Entries[0].MessageAttributes.CorrelationId.StringValue,
    ).toBe("correlationId1");

    const parsed = JSON.parse(firstInput.Entries[0].MessageBody);
    expect(parsed.id).toBe("letter0");

    // check last batch had 5 entries
    const thirdCallArg = sqsClientSendMock.mock.calls[2][0];
    const thirdInput = thirdCallArg.input;
    expect(thirdInput.Entries.length).toBe(5);
    // ids in third batch should start "2-0"
    expect(thirdInput.Entries[0].Id).toBe("2-0");
  });

  it("should log error when SendMessageBatch returns Failed entries", async () => {
    const sqsClient = {
      send: jest
        .fn()
        .mockResolvedValueOnce({ Failed: [] }) // first batch succeeds
        .mockResolvedValueOnce({
          Failed: [
            { Id: "1-1", SenderFault: false, Code: "Err", Message: "failed" },
          ],
        }),
    } as unknown as SQSClient;
    const logger = { error: jest.fn() } as unknown as pino.Logger;
    const env = {
      QUEUE_URL: "sqsUrl",
    };
    const deps: Deps = { sqsClient, logger, env } as Deps;

    const lettersToUpdate = Array.from({ length: 12 }, (_, i) =>
      makeLetterDto(i),
    );

    const result = await enqueueLetterUpdateRequests(
      lettersToUpdate,
      "correlationId1",
      deps,
    );

    expect(result).toBeUndefined();

    // 12 = 10 + 2
    expect(deps.sqsClient.send).toHaveBeenCalledTimes(2);

    expect(deps.logger.error).toHaveBeenCalledTimes(1);
    const errorArgs = (deps.logger.error as jest.Mock).mock.calls[0][0];
    expect(errorArgs.failed).toBeDefined();
    expect(Array.isArray(errorArgs.failed)).toBe(true);
    expect(errorArgs.failed[0].Id).toBe("1-1");
  });

  it("should log error if enqueueing fails", async () => {
    const sqsClient = {
      send: jest
        .fn()
        .mockResolvedValueOnce({ Failed: [] }) // batch 0
        .mockImplementationOnce(() => {
          throw new Error("some failure");
        }) // batch 1
        .mockResolvedValueOnce({ Failed: [] }), // batch 2
    } as unknown as SQSClient;
    const logger = { error: jest.fn() } as unknown as pino.Logger;
    const env = {
      QUEUE_URL: "sqsUrl",
    };
    const deps: Deps = { sqsClient, logger, env } as Deps;

    const lettersToUpdate = Array.from({ length: 21 }, (_, i) =>
      makeLetterDto(i),
    );

    await enqueueLetterUpdateRequests(lettersToUpdate, "correlationId1", deps);

    // all 3 attempted
    expect(deps.sqsClient.send).toHaveBeenCalledTimes(3);

    expect(deps.logger.error).toHaveBeenCalledTimes(1);
    const logged = (deps.logger.error as jest.Mock).mock.calls[0][0];
    expect(logged.correlationId).toBe("correlationId1");
    expect(logged.err).toBeInstanceOf(Error);
  });
});
