import {
  Letter,
  LetterAlreadyExistsError,
  LetterDoesNotExistError,
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
import { Unit } from "aws-embedded-metrics";
import { Deps } from "../deps";
import createHandler from "../update-letter-queue";
import { EnvVars } from "../env";
import { LetterStatus } from "../../../api-handler/src/contracts/letters";

const mockedDeps: jest.Mocked<Deps> = {
  letterQueueRepository: {
    putLetter: jest.fn(),
    deleteLetter: jest.fn(),
  } as unknown as LetterQueueRepository,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as pino.Logger,
  env: {} as unknown as EnvVars,
} as Deps;

function generateLetter(
  status: LetterStatus,
  overrides?: Partial<Letter>,
): Letter {
  return {
    id: "1",
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
    specificationBillingId: "billing1",
    priority: 2,
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetAllMocks();
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
        priority: 2,
      });
      expect(result.batchItemFailures).toEqual([]);
    });

    it("deletes letters that are no longer pending", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("PENDING");
      const newLetter = generateLetter("ACCEPTED");

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).toHaveBeenCalledWith("supplier1", "1");
      expect(result.batchItemFailures).toEqual([]);
    });

    it("does not publish non-PENDING letters", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = generateLetter("ACCEPTED");

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([]);
    });

    it("does not delete letters that are still PENDING", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("PENDING");
      const newLetter = generateLetter("PENDING");

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).not.toHaveBeenCalled();
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
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "seq-0" }]);
    });

    it("returns on the first failure", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", { id: "1" });
      const newLetter2 = generateLetter("PENDING", { id: "2" });
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
      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "seq-0" }]);
    });

    it("does not treat a replayed insert as a failure", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", { id: "1" });
      const newLetter2 = generateLetter("PENDING", { id: "2" });
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

    it("does not treat a replayed delete as a failure", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter1 = generateLetter("PENDING", { id: "1" });
      const oldLetter2 = generateLetter("PENDING", { id: "2" });
      const newLetter1 = generateLetter("ACCEPTED", { id: "1" });
      const newLetter2 = generateLetter("ACCEPTED", { id: "2" });
      (mockedDeps.letterQueueRepository.deleteLetter as jest.Mock)
        .mockRejectedValueOnce(new LetterDoesNotExistError("supplier1", "1"))
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter1, newLetter1),
        generateModifyRecord(oldLetter2, newLetter2),
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
    // eslint-disable-next-line jest/expect-expect
    it("logs a metric containing the delta of pending letters added/deleted", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter1 = generateLetter("PENDING", { id: "1" });
      const newLetter1 = generateLetter("ACCEPTED", { id: "1" });
      const newLetter2 = generateLetter("PENDING", { id: "2" });
      const newLetter3 = generateLetter("PENDING", { id: "3" });

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter1, newLetter1),
        generateInsertRecord(newLetter2),
        generateInsertRecord(newLetter3),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertQueueDeltaMetricLogged("supplier1", 1);
    });

    // eslint-disable-next-line jest/expect-expect
    it("breaks the metric down by supplier", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter1 = generateLetter("PENDING", { id: "1" });
      const newLetter1 = generateLetter("ACCEPTED", { id: "1" });
      const newLetter2 = generateLetter("PENDING", {
        supplierId: "supplier2",
        id: "2",
      });
      const newLetter3 = generateLetter("PENDING", { id: "3" });

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter1, newLetter1),
        generateInsertRecord(newLetter2),
        generateInsertRecord(newLetter3),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertQueueDeltaMetricLogged("supplier1", 0);
      assertQueueDeltaMetricLogged("supplier2", 1);
    });

    // eslint-disable-next-line jest/expect-expect
    it("counts a failed insert as zero", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", { id: "1" });
      const newLetter2 = generateLetter("PENDING", { id: "2" });
      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("DynamoDB error"));

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertQueueDeltaMetricLogged("supplier1", 1);
    });

    // eslint-disable-next-line jest/expect-expect
    it("counts a failed delete as zero", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter1 = generateLetter("PENDING", { id: "1" });
      const oldLetter2 = generateLetter("PENDING", { id: "2" });
      const newLetter1 = generateLetter("ACCEPTED", { id: "1" });
      const newLetter2 = generateLetter("ACCEPTED", { id: "2" });
      (mockedDeps.letterQueueRepository.deleteLetter as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("DynamoDB error"));

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter1, newLetter1),
        generateModifyRecord(oldLetter2, newLetter2),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertQueueDeltaMetricLogged("supplier1", -1);
    });

    // eslint-disable-next-line jest/expect-expect
    it("counts a replayed insert as zero", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", { id: "1" });
      const newLetter2 = generateLetter("PENDING", { id: "2" });

      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockRejectedValueOnce(new LetterAlreadyExistsError("supplier1", "1"))
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertQueueDeltaMetricLogged("supplier1", 1);
    });

    // eslint-disable-next-line jest/expect-expect
    it("counts a replayed delete as zero", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter1 = generateLetter("PENDING", { id: "1" });
      const oldLetter2 = generateLetter("PENDING", { id: "2" });
      const newLetter1 = generateLetter("ACCEPTED", { id: "1" });
      const newLetter2 = generateLetter("ACCEPTED", { id: "2" });
      (mockedDeps.letterQueueRepository.deleteLetter as jest.Mock)
        .mockRejectedValueOnce(new LetterDoesNotExistError("supplier1", "1"))
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter1, newLetter1),
        generateModifyRecord(oldLetter2, newLetter2),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertQueueDeltaMetricLogged("supplier1", -1);
    });

    // eslint-disable-next-line jest/expect-expect
    it("logs zero counts when no pending letters are in the batch", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = generateLetter("PRINTED");

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      assertQueueDeltaMetricNotLogged();
    });

    it("skips records with no NewImage (e.g. DELETE events) without error", async () => {
      const handler = createHandler(mockedDeps);
      const deleteRecord: DynamoDBRecord = {
        eventName: "REMOVE",
        dynamodb: { OldImage: mapToImage(generateLetter("PENDING")) },
      };

      const testData = generateKinesisEvent([deleteRecord]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([]);
      assertQueueDeltaMetricNotLogged();
    });
  });
});

function generateKinesisEvent(letterEvents: object[]): KinesisStreamEvent {
  const records = letterEvents
    .map((letter) => Buffer.from(JSON.stringify(letter)).toString("base64"))
    .map(
      (data, index) =>
        ({
          kinesis: { data, sequenceNumber: `seq-${index}` },
        }) as unknown as KinesisStreamRecordPayload,
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

function assertQueueDeltaMetricLogged(supplierId: string, delta: number) {
  expect(mockedDeps.logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      supplier: supplierId,
      _aws: expect.objectContaining({
        CloudWatchMetrics: expect.arrayContaining([
          expect.objectContaining({
            Metrics: [
              expect.objectContaining({
                Name: "QueueDelta",
                Value: delta,
                Unit: Unit.Count,
              }),
            ],
          }),
        ]),
      }),
      QueueDelta: delta,
    }),
  );
}

function assertQueueDeltaMetricNotLogged() {
  expect(mockedDeps.logger.info).not.toHaveBeenCalledWith(
    expect.objectContaining({
      _aws: expect.objectContaining({
        CloudWatchMetrics: expect.arrayContaining([
          expect.objectContaining({
            Metrics: [
              expect.objectContaining({
                Name: "QueueDelta",
              }),
            ],
          }),
        ]),
      }),
    }),
  );
}
