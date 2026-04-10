import { Logger } from "pino";
import {
  DBContext,
  createTables,
  deleteTables,
  setupDynamoDBContainer,
} from "./db";
import { LetterRepository } from "../letter-repository";
import { InsertLetter, Letter, UpdateLetter } from "../types";
import { createTestLogger } from "./logs";
import LetterAlreadyExistsError from "../errors/letter-already-exists-error";

function createLetter(
  supplierId: string,
  letterId: string,
  status: Letter["status"] = "PENDING",
  eventId?: string,
): InsertLetter {
  const now = new Date().toISOString();
  return {
    id: letterId,
    eventId,
    supplierId,
    specificationId: "specification1",
    groupId: "group1",
    url: `s3://bucket/${letterId}.pdf`,
    status,
    createdAt: now,
    updatedAt: now,
    source: "/data-plane/letter-rendering/pdf",
    subject: `client/1/letter-request/${letterId}`,
    billingRef: "specification1",
    specificationBillingId: "billing1",
  };
}

function assertDateBetween(date: number, before: number, after: number) {
  expect(date).toBeGreaterThanOrEqual(before);
  expect(date).toBeLessThanOrEqual(after);
}

// Database tests can take longer, especially with setup and teardown
jest.setTimeout(30_000);

describe("LetterRepository", () => {
  let db: DBContext;
  let letterRepository: LetterRepository;
  let logger: Logger;

  beforeAll(async () => {
    db = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(db);
    ({ logger } = createTestLogger());

    letterRepository = new LetterRepository(db.docClient, logger, db.config);
  });

  afterEach(async () => {
    await deleteTables(db);
    jest.useRealTimers();
  });

  afterAll(async () => {
    await db.container.stop();
  });

  async function checkLetterStatus(
    supplierId: string,
    letterId: string,
    status: Letter["status"],
  ) {
    const letter = await letterRepository.getLetterById(supplierId, letterId);
    expect(letter.status).toBe(status);
  }

  function assertTtl(ttl: number, before: number, after: number) {
    const expectedLower = Math.floor(
      before / 1000 + 60 * 60 * db.config.lettersTtlHours,
    );
    const expectedUpper = Math.floor(
      after / 1000 + 60 * 60 * db.config.lettersTtlHours,
    );
    expect(ttl).toBeGreaterThanOrEqual(expectedLower);
    expect(ttl).toBeLessThanOrEqual(expectedUpper);
  }

  test("adds a letter to the database", async () => {
    const supplierId = "supplier1";
    const letterId = "letter1";

    const before = Date.now();

    await letterRepository.putLetter(createLetter(supplierId, letterId));

    const after = Date.now();

    const letter = await letterRepository.getLetterById(supplierId, letterId);
    expect(letter).toBeDefined();
    expect(letter.id).toBe(letterId);
    expect(letter.supplierId).toBe(supplierId);
    assertDateBetween(new Date(letter.createdAt).valueOf(), before, after);
    assertDateBetween(new Date(letter.updatedAt).valueOf(), before, after);
    assertDateBetween(
      new Date(letter.supplierStatusSk).valueOf(),
      before,
      after,
    );
    expect(letter.supplierStatus).toBe("supplier1#PENDING");
    expect(letter.url).toBe("s3://bucket/letter1.pdf");
    expect(letter.specificationId).toBe("specification1");
    expect(letter.groupId).toBe("group1");
    expect(letter.reasonCode).toBeUndefined();
    expect(letter.reasonText).toBeUndefined();
    expect(letter.subject).toBe(`client/1/letter-request/${letterId}`);
    expect(letter.billingRef).toBe("specification1");
    assertTtl(letter.ttl, before, after);
  });

  test("fetches a letter by id", async () => {
    await letterRepository.putLetter(createLetter("supplier1", "letter1"));
    const letter = await letterRepository.getLetterById("supplier1", "letter1");
    expect(letter).toEqual(
      expect.objectContaining({
        id: "letter1",
        supplierId: "supplier1",
        specificationId: "specification1",
        groupId: "group1",
        status: "PENDING",
        url: "s3://bucket/letter1.pdf",
        source: "/data-plane/letter-rendering/pdf",
        subject: "client/1/letter-request/letter1",
      }),
    );
  });

  test("throws an error when fetching a letter that does not exist", async () => {
    await expect(
      letterRepository.getLetterById("supplier1", "letter1"),
    ).rejects.toThrow(
      "Letter not found: supplierId=supplier1, letterId=letter1",
    );
  });

  test("throws an error when creating a letter which already exists", async () => {
    await letterRepository.putLetter(createLetter("supplier1", "letter1"));
    await expect(
      letterRepository.putLetter(createLetter("supplier1", "letter1")),
    ).rejects.toThrow(LetterAlreadyExistsError);
  });

  test("rethrows errors from DynamoDB when creating a letter", async () => {
    const misconfiguredRepository = new LetterRepository(db.docClient, logger, {
      ...db.config,
      lettersTableName: "nonexistent-table",
    });
    await expect(
      misconfiguredRepository.putLetter(createLetter("supplier1", "letter1")),
    ).rejects.toThrow("Cannot do operations on a non-existent table");
  });

  test("updates a letter's status in the database", async () => {
    const letter = createLetter("supplier1", "letter1");
    await letterRepository.putLetter(letter);
    await checkLetterStatus("supplier1", "letter1", "PENDING");

    const updateLetter: UpdateLetter = {
      id: "letter1",
      eventId: "event1",
      supplierId: "supplier1",
      status: "REJECTED",
      reasonCode: "R01",
      reasonText: "Reason text",
    };
    await letterRepository.updateLetterStatus(updateLetter);

    const updatedLetter = await letterRepository.getLetterById(
      "supplier1",
      "letter1",
    );
    expect(updatedLetter.status).toBe("REJECTED");
    expect(updatedLetter.previousStatus).toBe("PENDING");
    expect(updatedLetter.reasonCode).toBe("R01");
    expect(updatedLetter.reasonText).toBe("Reason text");
  });

  test("updates a letter's updatedAt date", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 1, 1));
    await letterRepository.putLetter(createLetter("supplier1", "letter1"));
    const originalLetter = await letterRepository.getLetterById(
      "supplier1",
      "letter1",
    );
    expect(originalLetter.updatedAt).toBe("2020-02-01T00:00:00.000Z");

    // Month is zero-indexed in JavaScript Date
    // Day is one-indexed
    jest.setSystemTime(new Date(2020, 1, 2));
    const letterDto: UpdateLetter = {
      id: "letter1",
      eventId: "event1",
      supplierId: "supplier1",
      status: "DELIVERED",
    };

    await letterRepository.updateLetterStatus(letterDto);
    const updatedLetter = await letterRepository.getLetterById(
      "supplier1",
      "letter1",
    );

    expect(updatedLetter.updatedAt).toBe("2020-02-02T00:00:00.000Z");
  });

  test("can't update a letter that does not exist", async () => {
    const updateLetter: UpdateLetter = {
      id: "letter1",
      eventId: "event1",
      supplierId: "supplier1",
      status: "DELIVERED",
    };
    await expect(
      letterRepository.updateLetterStatus(updateLetter),
    ).rejects.toThrow(
      "Letter with id letter1 not found for supplier supplier1",
    );
  });

  test("update letter status rethrows errors from DynamoDB", async () => {
    const misconfiguredRepository = new LetterRepository(db.docClient, logger, {
      ...db.config,
      lettersTableName: "nonexistent-table",
    });

    const updateLetter: UpdateLetter = {
      id: "letter1",
      eventId: "event1",
      supplierId: "supplier1",
      status: "DELIVERED",
    };
    await expect(
      misconfiguredRepository.updateLetterStatus(updateLetter),
    ).rejects.toThrow("Cannot do operations on a non-existent table");
  });

  test("does not update a letter if the same eventId is used", async () => {
    const letter = createLetter("supplier1", "letter1", "DELIVERED", "event1");
    await letterRepository.putLetter(letter);

    const duplicateUpdate: UpdateLetter = {
      id: "letter1",
      eventId: "event1",
      supplierId: "supplier1",
      status: "REJECTED",
      reasonCode: "R01",
    };
    const result = await letterRepository.updateLetterStatus(duplicateUpdate);

    expect(result).toBeUndefined();
    const unchangedLetter = await letterRepository.getLetterById(
      "supplier1",
      "letter1",
    );
    expect(unchangedLetter.status).toBe("DELIVERED");
    expect(unchangedLetter.eventId).toBe("event1");
    expect(unchangedLetter.reasonCode).toBeUndefined();
  });

  test("updates a letter if a different eventId is used", async () => {
    const letter = createLetter("supplier1", "letter1", "DELIVERED", "event1");
    await letterRepository.putLetter(letter);

    const duplicateUpdate: UpdateLetter = {
      id: "letter1",
      eventId: "event2",
      supplierId: "supplier1",
      status: "REJECTED",
      reasonCode: "R01",
    };
    const result = await letterRepository.updateLetterStatus(duplicateUpdate);

    expect(result).toBeDefined();
    const changedLetter = await letterRepository.getLetterById(
      "supplier1",
      "letter1",
    );
    expect(changedLetter.status).toBe("REJECTED");
    expect(changedLetter.eventId).toBe("event2");
    expect(changedLetter.reasonCode).toBe("R01");
  });

  test("should batch write letters to the database", async () => {
    const before = Date.now();

    await letterRepository.unsafePutLetterBatch([
      createLetter("supplier1", "letter1"),
      createLetter("supplier1", "letter2"),
      createLetter("supplier1", "letter3"),
    ]);

    const after = Date.now();

    const letter = await letterRepository.getLetterById("supplier1", "letter1");
    expect(letter).toBeDefined();
    expect(letter.id).toBe("letter1");
    expect(letter.supplierId).toBe("supplier1");
    assertDateBetween(new Date(letter.createdAt).valueOf(), before, after);
    assertDateBetween(new Date(letter.updatedAt).valueOf(), before, after);
    assertDateBetween(
      new Date(letter.supplierStatusSk).valueOf(),
      before,
      after,
    );
    expect(letter.supplierStatus).toBe("supplier1#PENDING");
    expect(letter.url).toBe("s3://bucket/letter1.pdf");
    expect(letter.specificationId).toBe("specification1");
    expect(letter.groupId).toBe("group1");
    expect(letter.reasonCode).toBeUndefined();
    expect(letter.reasonText).toBeUndefined();
    expect(letter.subject).toBe("client/1/letter-request/letter1");
    assertTtl(letter.ttl, before, after);

    await checkLetterStatus("supplier1", "letter2", "PENDING");
    await checkLetterStatus("supplier1", "letter3", "PENDING");
  });

  test("should batch in calls upto 25", async () => {
    const letters = [];
    for (let i = 0; i < 60; i++) {
      letters.push(createLetter("supplier1", `letter${i}`));
    }

    const sendSpy = jest.spyOn(db.docClient, "send");

    await letterRepository.unsafePutLetterBatch(letters);

    expect(sendSpy).toHaveBeenCalledTimes(3);

    await checkLetterStatus("supplier1", "letter1", "PENDING");
    await checkLetterStatus("supplier1", "letter6", "PENDING");
    await checkLetterStatus("supplier1", "letter59", "PENDING");
  });

  // eslint-disable-next-line jest/expect-expect
  test("should skip array gaps", async () => {
    const letters = [];
    letters[0] = createLetter("supplier1", "letter1");
    letters[2] = createLetter("supplier1", "letter3");

    await letterRepository.unsafePutLetterBatch(letters);

    await checkLetterStatus("supplier1", "letter1", "PENDING");
    await checkLetterStatus("supplier1", "letter3", "PENDING");
  });

  test("rethrows errors from DynamoDB when batch creating letter", async () => {
    const misconfiguredRepository = new LetterRepository(db.docClient, logger, {
      ...db.config,
      lettersTableName: "nonexistent-table",
    });
    await expect(
      misconfiguredRepository.unsafePutLetterBatch([
        createLetter("supplier1", "letter1"),
      ]),
    ).rejects.toThrow("Cannot do operations on a non-existent table");
  });
});
