import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import {
  DBContext,
  createTables,
  deleteTables,
  setupDynamoDBContainer,
} from "./db";
import LetterQueueRepository from "../letter-queue-repository";
import { PendingLetterBase } from "../types";
import { LetterAlreadyExistsError } from "../letter-already-exists-error";
import { createTestLogger } from "./logs";
import { LetterDoesNotExistError } from "../letter-does-not-exist-error";

function createLetter(letterId = "letter1"): PendingLetterBase {
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
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await db.container.stop();
  });

  describe("putLetter", () => {
    it("adds a letter to the database", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-04T13:15:45.000Z"));

      const pendingLetter =
        await letterQueueRepository.putLetter(createLetter());

      expect(pendingLetter.queueTimestamp).toBe("2026-03-04T13:15:45.000Z");
      expect(pendingLetter.ttl).toBe(1_772_633_745);
      expect(await letterExists(db, "supplier1", "letter1")).toBe(true);
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

  describe("deleteLetter", () => {
    it("deletes a letter from the database", async () => {
      await letterQueueRepository.putLetter(createLetter());

      await letterQueueRepository.deleteLetter("supplier1", "letter1");

      expect(await letterExists(db, "supplier1", "letter1")).toBe(false);
    });

    it("throws an error when the letter does not exist", async () => {
      await expect(
        letterQueueRepository.deleteLetter("supplier1", "letter1"),
      ).rejects.toThrow(LetterDoesNotExistError);
    });

    it("rethrows errors from DynamoDB when deleting a letter", async () => {
      const misconfiguredRepository = new LetterQueueRepository(
        db.docClient,
        logger,
        {
          ...db.config,
          letterQueueTableName: "nonexistent-table",
        },
      );
      await expect(
        misconfiguredRepository.deleteLetter("supplier1", "letter1"),
      ).rejects.toThrow("Cannot do operations on a non-existent table");
    });
  });

  describe("getLetters", () => {
    it("filters by supplierId", async () => {
      await letterQueueRepository.putLetter(createLetter());

      const letters = await letterQueueRepository.getLetters("supplier2", 1);

      expect(letters).toHaveLength(0);
    });

    it("filters by queueTimestamp", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-04T13:25:45.000Z"));
      await letterQueueRepository.putLetter(createLetter());
      jest.useFakeTimers().setSystemTime(new Date("2026-03-04T13:23:45.000Z"));

      const letters = await letterQueueRepository.getLetters("supplier1", 1);

      expect(letters).toHaveLength(0);
    });

    it("returns letters in timestamp order", async () => {
      await letterQueueRepository.putLetter(createLetter("first-letter"));
      await letterQueueRepository.putLetter(createLetter("second-letter"));
      await letterQueueRepository.putLetter(createLetter("third-letter"));
      await letterQueueRepository.putLetter(createLetter("fourth-letter"));
      await letterQueueRepository.putLetter(createLetter("fifth-letter"));

      const letters = await letterQueueRepository.getLetters("supplier1", 5);

      expect(letters[0].letterId).toBe("first-letter");
      expect(letters[1].letterId).toBe("second-letter");
      expect(letters[2].letterId).toBe("third-letter");
      expect(letters[3].letterId).toBe("fourth-letter");
      expect(letters[4].letterId).toBe("fifth-letter");
    });

    it("limits results to the supplied number", async () => {
      await letterQueueRepository.putLetter(createLetter("first-letter"));
      await letterQueueRepository.putLetter(createLetter("second-letter"));
      await letterQueueRepository.putLetter(createLetter("third-letter"));
      await letterQueueRepository.putLetter(createLetter("fourth-letter"));

      const letters = await letterQueueRepository.getLetters("supplier1", 3);

      expect(letters).toHaveLength(3);
      expect(letters[2].letterId).toBe("third-letter");
    });
  });

  describe("updateLetterTimestamp", () => {
    it("updates the queueTimestamp on an existing letter", async () => {
      const pendingLetter =
        await letterQueueRepository.putLetter(createLetter());

      await letterQueueRepository.updateLetterTimestamp(
        pendingLetter,
        new Date("2026-03-04T13:15:45.000Z"),
      );

      const letter = await getLetter(db, "supplier1", "letter1");
      expect(letter?.queueTimestamp).toBe("2026-03-04T13:15:45.000Z");
    });

    it("does nothing when the letter does not exist", async () => {
      await letterQueueRepository.updateLetterTimestamp(
        createLetter(),
        new Date(),
      );

      expect(await letterExists(db, "supplier1", "letter1")).toBe(false);
    });

    it("rethrows errors from DynamoDB when updating the letter", async () => {
      const misconfiguredRepository = new LetterQueueRepository(
        db.docClient,
        logger,
        {
          ...db.config,
          letterQueueTableName: "nonexistent-table",
        },
      );
      await expect(
        misconfiguredRepository.updateLetterTimestamp(
          createLetter(),
          new Date(),
        ),
      ).rejects.toThrow("Cannot do operations on a non-existent table");
    });
  });
});

async function getLetter(db: DBContext, supplierId: string, letterId: string) {
  const result = await db.docClient.send(
    new GetCommand({
      TableName: db.config.letterQueueTableName,
      Key: { supplierId, letterId },
    }),
  );
  return result.Item;
}

async function letterExists(
  db: DBContext,
  supplierId: string,
  letterId: string,
): Promise<boolean> {
  const letter = await getLetter(db, supplierId, letterId);
  return letter !== undefined;
}
