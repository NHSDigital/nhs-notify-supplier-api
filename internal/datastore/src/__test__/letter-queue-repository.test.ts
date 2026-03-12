import { Logger } from "pino";
import {
  DBContext,
  createTables,
  deleteTables,
  setupDynamoDBContainer,
} from "./db";
import LetterQueueRepository from "../letter-queue-repository";
import { InsertPendingLetter } from "../types";
import { LetterAlreadyExistsError } from "../errors";
import { createTestLogger } from "./logs";

function createLetter(letterId = "letter1"): InsertPendingLetter {
  return {
    letterId,
    supplierId: "supplier1",
    specificationId: "specification1",
    groupId: "group1",
  };
}

// Database tests can take longer, especially with setup and teardown
jest.setTimeout(30_000);

describe("LetterQueueRepository", () => {
  let db: DBContext;
  let letterQueueRepository: LetterQueueRepository;
  let logger: Logger;

  beforeAll(async () => {
    db = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(db);
    ({ logger } = createTestLogger());

    letterQueueRepository = new LetterQueueRepository(
      db.docClient,
      logger,
      db.config,
    );
  });

  afterEach(async () => {
    await deleteTables(db);
    jest.useRealTimers();
  });

  afterAll(async () => {
    await db.container.stop();
  });

  function assertTtl(ttl: number, before: number, after: number) {
    const expectedLower = Math.floor(
      before / 1000 + 60 * 60 * db.config.letterQueueTtlHours,
    );
    const expectedUpper = Math.floor(
      after / 1000 + 60 * 60 * db.config.lettersTtlHours,
    );
    expect(ttl).toBeGreaterThanOrEqual(expectedLower);
    expect(ttl).toBeLessThanOrEqual(expectedUpper);
  }

  describe("putLetter", () => {
    it("adds a letter to the database", async () => {
      const before = Date.now();

      const pendingLetter =
        await letterQueueRepository.putLetter(createLetter());

      const after = Date.now();

      const timestampInMillis = new Date(
        pendingLetter.queueTimestamp,
      ).valueOf();
      expect(timestampInMillis).toBeGreaterThanOrEqual(before);
      expect(timestampInMillis).toBeLessThanOrEqual(after);
      assertTtl(pendingLetter.ttl, before, after);
    });

    it("throws LetterAlreadyExistsError when creating a letter which already exists", async () => {
      await letterQueueRepository.putLetter(createLetter());

      await expect(
        letterQueueRepository.putLetter(createLetter()),
      ).rejects.toThrow(LetterAlreadyExistsError);
    });

    it("rethrows errors from DynamoDB when creating a letter", async () => {
      const misconfiguredRepository = new LetterQueueRepository(
        db.docClient,
        logger,
        {
          ...db.config,
          letterQueueTableName: "nonexistent-table",
        },
      );
      await expect(
        misconfiguredRepository.putLetter(createLetter()),
      ).rejects.toThrow("Cannot do operations on a non-existent table");
    });
  });
});
