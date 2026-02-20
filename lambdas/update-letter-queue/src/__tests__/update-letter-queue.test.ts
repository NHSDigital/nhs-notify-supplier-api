import {
  Letter,
  LetterAlreadyExistsError,
  LetterQueueRepository,
} from "@internal/datastore";
import { mockDeep } from "jest-mock-extended";
import pino from "pino";
import {
  Context,
  DynamoDBRecord,
  KinesisStreamEvent,
  KinesisStreamRecordPayload,
} from "aws-lambda";
import { Deps } from "../deps";
import createHandler from "../update-letter-queue";
import { EnvVars } from "../env";
import { LetterStatus } from "../../../api-handler/src/contracts/letters";

const mockedDeps: jest.Mocked<Deps> = {
  letterQueueRepository: {
    putLetter: jest.fn(),
  } as unknown as LetterQueueRepository,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as pino.Logger,
  env: {} as unknown as EnvVars,
} as Deps;

function generateLetter(status: LetterStatus, id?: string): Letter {
  return {
    id: id || "1",
    status,
    specificationId: "spec1",
    supplierId: "supplier1",
    groupId: "group1",
    url: "https://example.com/letter.pdf",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    supplierStatus: "supplier1#PENDING",
    supplierStatusSk: "2026-01-01T00:00:00.000Z#1",
    ttl: 1_735_689_600,
    source: "test-source",
    subject: "test-subject",
    billingRef: "billing-ref-1",
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("update-letter-queue Lambda", () => {
  describe("filtering", () => {
    it("processes new pending letters and persists them in the letter queue table", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = generateLetter("PENDING");
      (
        mockedDeps.letterQueueRepository.putLetter as jest.Mock
      ).mockResolvedValue({ alreadyProcessed: false });

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledWith({
        supplierId: "supplier1",
        letterId: "1",
        specificationId: "spec1",
        groupId: "group1",
      });
      expect(result.batchItemFailures).toEqual([]);
    });

    it("does not publish updates", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("PENDING");
      const newLetter = generateLetter("PENDING");

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([]);
    });

    it("does not publish non-PENDING letters", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = generateLetter("PRINTED");

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([]);
    });

    it("handles empty Records array", async () => {
      const handler = createHandler(mockedDeps);
      const testData = { Records: [] } as unknown as KinesisStreamEvent;

      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([]);
    });
  });

  describe("Error handling", () => {
    it("rejects invalid letter data", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = { id: "1", status: "PENDING" } as Letter;

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      await expect(
        handler(testData, mockDeep<Context>(), jest.fn()),
      ).rejects.toThrow();

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
    });

    it("returns on the first failure", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", "1");
      const newLetter2 = generateLetter("PENDING", "2");
      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockRejectedValueOnce({})
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledTimes(
        1,
      );
      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "1" }]);
    });

    it("does not treat a replayed event as a failure", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", "1");
      const newLetter2 = generateLetter("PENDING", "2");
      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockRejectedValueOnce(new LetterAlreadyExistsError("supplier1", "1"))
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(result.batchItemFailures).toEqual([]);
    });

    it("throws error when Kinesis payload cannot be parsed as JSON", async () => {
      const handler = createHandler(mockedDeps);
      const invalidJsonPayload = "not valid json {{{";
      const testData = {
        Records: [
          {
            kinesis: {
              sequenceNumber: "seq-123",
              data: Buffer.from(invalidJsonPayload).toString("base64"),
            },
            eventID: "event-123",
          },
        ],
      } as unknown as KinesisStreamEvent;

      await expect(
        handler(testData, mockDeep<Context>(), jest.fn()),
      ).rejects.toThrow();

      expect(mockedDeps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Error extracting payload",
          eventId: "event-123",
        }),
      );
    });
  });

  describe("Metrics", () => {
    it("emits success metrics when all letters are processed successfully", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", "1");
      const newLetter2 = generateLetter("PENDING", "2");

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertSuccessMetricLogged(2);
      assertFailureMetricLogged(0);
    });

    it("emits failure metrics when a letter fails to process", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", "1");
      const newLetter2 = generateLetter("PENDING", "2");
      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("DynamoDB error"));

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertSuccessMetricLogged(1);
      assertFailureMetricLogged(1);
    });

    it("does not count a reprocessed event as a success or failure", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", "1");
      const newLetter2 = generateLetter("PENDING", "2");
      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockRejectedValueOnce(new LetterAlreadyExistsError("supplier1", "1"))
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertSuccessMetricLogged(1);
      assertFailureMetricLogged(0);
    });

    it("emits zero success metrics when no pending letters are in the batch", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = generateLetter("PRINTED");

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertSuccessMetricLogged(0);
      assertFailureMetricLogged(0);
    });
  });
});

function generateKinesisEvent(letterEvents: object[]): KinesisStreamEvent {
  const records = letterEvents
    .map((letter) => Buffer.from(JSON.stringify(letter)).toString("base64"))
    .map(
      (data) =>
        ({ kinesis: { data } }) as unknown as KinesisStreamRecordPayload,
    );

  return { Records: records } as unknown as KinesisStreamEvent;
}

function generateInsertRecord(newLetter: Letter): DynamoDBRecord {
  return {
    eventName: "INSERT",
    dynamodb: { NewImage: mapToImage(newLetter) },
  };
}

function generateModifyRecord(
  oldLetter: Letter,
  newLetter: Letter,
): DynamoDBRecord {
  return {
    eventName: "MODIFY",
    dynamodb: {
      OldImage: mapToImage(oldLetter),
      NewImage: mapToImage(newLetter),
    },
  };
}

function mapToImage(oldLetter: Letter) {
  return Object.fromEntries(
    Object.entries(oldLetter).map(([key, value]) => [
      key,
      typeof value === "string" ? { S: value } : { N: String(value) },
    ]),
  );
}

function assertSuccessMetricLogged(count: number) {
  expect(mockedDeps.logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      _aws: expect.objectContaining({
        CloudWatchMetrics: expect.arrayContaining([
          expect.objectContaining({
            Metrics: [
              expect.objectContaining({
                Name: "letters queued successfully",
                Value: count,
              }),
            ],
          }),
        ]),
      }),
    }),
  );
}

function assertFailureMetricLogged(count: number) {
  expect(mockedDeps.logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      _aws: expect.objectContaining({
        CloudWatchMetrics: expect.arrayContaining([
          expect.objectContaining({
            Metrics: [
              expect.objectContaining({
                Name: "letters queued failed",
                Value: count,
              }),
            ],
          }),
        ]),
      }),
    }),
  );
}
