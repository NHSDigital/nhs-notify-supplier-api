import {
  Letter,
  LetterAlreadyExistsError,
  LetterNotFoundError,
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
import LogRefs from "../log-references";
import { LetterStatus } from "../../../api-handler/src/contracts/letters";

const mockedDeps: jest.Mocked<Deps> = {
  letterQueueRepository: {
    putLetter: jest.fn(),
    deleteLetter: jest.fn(),
  } as unknown as LetterQueueRepository,
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as pino.Logger,
  env: {} as unknown as EnvVars,
};

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
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          processedCount: 0,
          totalCount: 0,
        }),
      );
    });

    it("reports the batch size even when no letters are queued", async () => {
      const handler = createHandler(mockedDeps);
      const testData = generateKinesisEvent([
        generateInsertRecord(generateLetter("ACCEPTED")),
      ]);

      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(result.batchItemFailures).toEqual([]);
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 0,
          failureCount: 0,
          processedCount: 0,
          totalCount: 1,
        }),
      );
    });
  });

  describe("Error handling", () => {
    it("drops a pending letter that has no specificationId or groupId, without retrying it", async () => {
      const handler = createHandler(mockedDeps);
      // The queue entry needs specificationId and groupId, so this letter can never be queued.
      const newLetter = omitField(
        omitField(generateLetter("PENDING"), "specificationId"),
        "groupId",
      );

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([]);
      expect(mockedDeps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          logRef: LogRefs.INVALID_LETTER_DROPPED.code,
          recordId: "seq-0",
          supplierId: "supplier1",
          letterId: "1",
          invalidFields: [
            expect.stringMatching(/^specificationId: /),
            expect.stringMatching(/^groupId: /),
          ],
        }),
      );
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          logRef: LogRefs.PROCESSING_COMPLETE.code,
          failureCount: 0,
          droppedCount: 1,
        }),
      );
    });

    it("queues a pending letter that lacks fields the queue does not use", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = omitField(generateLetter("PENDING"), "billingRef");

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledWith(
        expect.objectContaining({ supplierId: "supplier1", letterId: "1" }),
      );
      expect(result.batchItemFailures).toEqual([]);
    });

    it("removes a letter from the queue using only its key fields", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("PENDING");
      const newLetter = omitField(
        generateLetter("ACCEPTED"),
        "specificationId",
      );

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).toHaveBeenCalledWith("supplier1", "1");
      expect(result.batchItemFailures).toEqual([]);
    });

    it.each([
      { field: "supplierId", supplierId: null, letterId: "1" },
      { field: "id", supplierId: "supplier1", letterId: null },
    ] as const)(
      "drops a removal when the letter has no $field, because it is part of the queue key",
      async ({ field, letterId, supplierId }) => {
        const handler = createHandler(mockedDeps);
        const testData = generateKinesisEvent([
          generateModifyRecord(
            generateLetter("PENDING"),
            omitField(generateLetter("ACCEPTED"), field),
          ),
        ]);

        const result = await handler(testData, mockDeep<Context>(), jest.fn());

        expect(
          mockedDeps.letterQueueRepository.deleteLetter,
        ).not.toHaveBeenCalled();
        expect(result.batchItemFailures).toEqual([]);
        expect(mockedDeps.logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            logRef: LogRefs.INVALID_LETTER_DROPPED.code,
            recordId: "seq-0",
            supplierId,
            letterId,
            invalidFields: [expect.stringContaining(`${field}: `)],
          }),
        );
      },
    );

    it("still processes later records for a letter after dropping its invalid record", async () => {
      const handler = createHandler(mockedDeps);
      const testData = generateKinesisEvent([
        // Invalid: no specificationId, so it cannot be queued and is dropped.
        generateInsertRecord(
          omitField(generateLetter("PENDING"), "specificationId"),
        ),
        // Same letter: the removal only needs supplierId and id, so it runs.
        generateModifyRecord(
          generateLetter("PENDING"),
          generateLetter("ACCEPTED"),
        ),
      ]);

      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).toHaveBeenCalledWith("supplier1", "1");
      expect(result.batchItemFailures).toEqual([]);
      expect(mockedDeps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          logRef: LogRefs.INVALID_LETTER_DROPPED.code,
          recordId: "seq-0",
          invalidFields: [expect.stringMatching(/^specificationId: /)],
        }),
      );
    });

    it("drops a letter whose image cannot be converted from DynamoDB format", async () => {
      const handler = createHandler(mockedDeps);
      const insertRecord = generateInsertRecord(generateLetter("PENDING"));
      // "X" is not a DynamoDB attribute type, so unmarshall throws a non-zod error.
      insertRecord.dynamodb!.NewImage!.groupId = { X: "?" } as never;

      const testData = generateKinesisEvent([insertRecord]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([]);
      expect(mockedDeps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          logRef: LogRefs.INVALID_LETTER_DROPPED.code,
          recordId: "seq-0",
          invalidFields: undefined,
          error: expect.objectContaining({
            message: "Unsupported type passed: X",
          }),
        }),
      );
    });

    it("waits for the batch and retries from the earliest failed record", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter1 = generateLetter("PENDING", { id: "1" });
      const newLetter2 = generateLetter("PENDING", { id: "2" });
      let rejectFirst: (error: Error) => void = jest.fn();
      const firstWrite = new Promise<void>((_resolve, reject) => {
        rejectFirst = reject;
      });
      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockImplementationOnce(() => firstWrite)
        .mockRejectedValueOnce(new Error("second write failed"));

      const testData = generateKinesisEvent([
        generateInsertRecord(newLetter1),
        generateInsertRecord(newLetter2),
      ]);
      const pendingResult = handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledTimes(
        2,
      );
      rejectFirst(new Error("first write failed"));
      const result = await pendingResult;

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "seq-0" }]);
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 0,
          failureCount: 2,
          totalCount: 2,
        }),
      );
    });

    it("serializes updates for the same letter without blocking other letters", async () => {
      const handler = createHandler(mockedDeps);
      let finishInsert: () => void = jest.fn();
      const insert = new Promise<void>((resolve) => {
        finishInsert = resolve;
      });
      (mockedDeps.letterQueueRepository.putLetter as jest.Mock)
        .mockImplementationOnce(() => insert)
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateInsertRecord(generateLetter("PENDING", { id: "1" })),
        generateModifyRecord(
          generateLetter("PENDING", { id: "1" }),
          generateLetter("ACCEPTED", { id: "1" }),
        ),
        generateInsertRecord(generateLetter("PENDING", { id: "2" })),
      ]);
      const pendingResult = handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).not.toHaveBeenCalled();
      finishInsert();
      const result = await pendingResult;

      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).toHaveBeenCalledWith("supplier1", "1");
      expect(result.batchItemFailures).toEqual([]);
      assertQueueDeltaMetricLogged("supplier1", 1);
    });

    it("skips later records for a letter whose earlier write failed", async () => {
      const handler = createHandler(mockedDeps);
      (
        mockedDeps.letterQueueRepository.putLetter as jest.Mock
      ).mockRejectedValue(new Error("DynamoDB error"));
      const testData = generateKinesisEvent([
        generateInsertRecord(generateLetter("PENDING", { id: "1" })),
        generateModifyRecord(
          generateLetter("PENDING", { id: "1" }),
          generateLetter("ACCEPTED", { id: "1" }),
        ),
      ]);

      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(
        mockedDeps.letterQueueRepository.deleteLetter,
      ).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "seq-0" }]);
      expect(mockedDeps.logger.error).toHaveBeenCalledTimes(1);
      expect(mockedDeps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          recordId: "seq-0",
          supplierId: "supplier1",
          letterId: "1",
        }),
      );
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 0,
          failureCount: 1,
          processedCount: 1,
          totalCount: 2,
        }),
      );
      assertQueueDeltaMetricNotLogged();
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
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          logRef: LogRefs.LETTER_ALREADY_EXISTS.code,
          supplierId: "supplier1",
          letterId: "1",
        }),
      );
    });

    it("does not treat a replayed delete as a failure", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter1 = generateLetter("PENDING", { id: "1" });
      const oldLetter2 = generateLetter("PENDING", { id: "2" });
      const newLetter1 = generateLetter("ACCEPTED", { id: "1" });
      const newLetter2 = generateLetter("ACCEPTED", { id: "2" });
      (mockedDeps.letterQueueRepository.deleteLetter as jest.Mock)
        .mockRejectedValueOnce(new LetterNotFoundError("supplier1", "1"))
        .mockResolvedValueOnce({});

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter1, newLetter1),
        generateModifyRecord(oldLetter2, newLetter2),
      ]);
      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(result.batchItemFailures).toEqual([]);
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          logRef: LogRefs.LETTER_DOES_NOT_EXIST.code,
          supplierId: "supplier1",
          letterId: "1",
        }),
      );
    });

    it("drops an invalid JSON payload and processes the rest of the batch", async () => {
      const handler = createHandler(mockedDeps);
      const invalidJsonPayload = "not valid json {{{";
      const testData = {
        Records: [
          {
            kinesis: {
              sequenceNumber: "seq-122",
              data: encodeRecord(
                generateInsertRecord(generateLetter("PENDING", { id: "1" })),
              ),
            },
          },
          {
            kinesis: {
              sequenceNumber: "seq-123",
              data: Buffer.from(invalidJsonPayload).toString("base64"),
            },
            eventID: "event-123",
          },
          {
            kinesis: {
              sequenceNumber: "seq-124",
              data: encodeRecord(
                generateInsertRecord(generateLetter("PENDING", { id: "2" })),
              ),
            },
          },
        ],
      } as unknown as KinesisStreamEvent;

      const result = await handler(testData, mockDeep<Context>(), jest.fn());

      expect(result.batchItemFailures).toEqual([]);
      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledTimes(
        2,
      );
      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledWith(
        expect.objectContaining({ letterId: "1" }),
      );
      expect(mockedDeps.letterQueueRepository.putLetter).toHaveBeenCalledWith(
        expect.objectContaining({ letterId: "2" }),
      );
      expect(mockedDeps.logger.error).toHaveBeenCalledTimes(1);
      expect(mockedDeps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Error extracting payload",
          eventId: "event-123",
          recordId: "seq-123",
        }),
      );
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 2,
          failureCount: 0,
          droppedCount: 1,
          totalCount: 3,
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
      // supplier1's delete and insert cancel out in the metric but are still two writes.
      expect(mockedDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 3,
          failureCount: 0,
          processedCount: 3,
          totalCount: 3,
        }),
      );
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
        .mockRejectedValueOnce(new LetterNotFoundError("supplier1", "1"))
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

// Simulates a stored letter that predates (or lacks) a schema field.
function omitField(letter: Letter, field: keyof Letter): Letter {
  return Object.fromEntries(
    Object.entries(letter).filter(([key]) => key !== field),
  ) as Letter;
}

function encodeRecord(record: DynamoDBRecord): string {
  return Buffer.from(JSON.stringify(record)).toString("base64");
}

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
