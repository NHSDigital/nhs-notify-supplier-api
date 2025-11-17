import { createTables, DBContext, deleteTables, setupDynamoDBContainer } from './db';
import { LetterRepository } from '../letter-repository';
import { Letter } from '../types';
import { Logger } from 'pino';
import { createTestLogger, LogStream } from './logs';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { LetterDto } from '../../../../lambdas/api-handler/src/contracts/letters';

function createLetter(supplierId: string, letterId: string, status: Letter['status'] = 'PENDING'): Omit<Letter, 'ttl' | 'supplierStatus' | 'supplierStatusSk'> {
  return {
    id: letterId,
    supplierId: supplierId,
    specificationId: 'specification1',
    groupId: 'group1',
    url: `s3://bucket/${letterId}.pdf`,
    status: status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Database tests can take longer, especially with setup and teardown
jest.setTimeout(30000);

describe('LetterRepository', () => {

  let db: DBContext;
  let letterRepository: LetterRepository;
  let logStream: LogStream;
  let logger: Logger;

  beforeAll(async () => {
    db = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(db);
    (
      { logStream, logger } = createTestLogger()
    );

    letterRepository = new LetterRepository(db.docClient, logger, db.config);
  });

  afterEach(async () => {
    await deleteTables(db);
    jest.useRealTimers();
  });

  afterAll(async () => {
    await db.container.stop();
  });

  async function checkLetterStatus(supplierId: string, letterId: string, status: Letter['status']) {
    const letter = await letterRepository.getLetterById(supplierId, letterId);
    expect(letter.status).toBe(status);
  }

  test('adds a letter to the database', async () => {
    const supplierId = 'supplier1';
    const letterId = 'letter1';

    await letterRepository.putLetter(createLetter(supplierId, letterId));

    const letter = await letterRepository.getLetterById(supplierId, letterId);
    expect(letter).toBeDefined();
    expect(letter.id).toBe(letterId);
    expect(letter.supplierId).toBe(supplierId);
    expect(letter.reasonCode).toBeUndefined();
    expect(letter.reasonText).toBeUndefined();
  });

  test('fetches a letter by id', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1'));
    const letter = await letterRepository.getLetterById('supplier1', 'letter1');
    expect(letter).toEqual(expect.objectContaining({
      id: 'letter1',
      supplierId: 'supplier1',
      specificationId: 'specification1',
      groupId: 'group1',
      status: 'PENDING'
    }));
  });

  test('throws an error when fetching a letter that does not exist', async () => {
    await expect(letterRepository.getLetterById('supplier1', 'letter1'))
      .rejects.toThrow('Letter with id letter1 not found for supplier supplier1');
  });

  test('throws an error when creating a letter which already exists', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1'));
    await expect(letterRepository.putLetter(createLetter('supplier1', 'letter1')))
      .rejects.toThrow('Letter with id letter1 already exists for supplier supplier1');
  });

  test('rethrows errors from DynamoDB when creating a letter', async () => {
    const misconfiguredRepository = new LetterRepository(db.docClient, logger, {
      ...db.config,
      lettersTableName: 'nonexistent-table'
    });
    await expect(misconfiguredRepository.putLetter(createLetter('supplier1', 'letter1')))
      .rejects.toThrow('Cannot do operations on a non-existent table');
  });

  test('updates a letter\'s status in the database', async () => {
    const letter = createLetter('supplier1', 'letter1', 'PENDING');
    await letterRepository.putLetter(letter);
    await checkLetterStatus('supplier1', 'letter1', 'PENDING');

    const letterDto: LetterDto = {
      id: 'letter1',
      supplierId: 'supplier1',
      status: 'REJECTED',
      reasonCode: 'R01',
      reasonText: 'Reason text'
    };
    await letterRepository.updateLetterStatus(letterDto);

    const updatedLetter = await letterRepository.getLetterById('supplier1', 'letter1');
    expect(updatedLetter.status).toBe('REJECTED');
    expect(updatedLetter.reasonCode).toBe('R01');
    expect(updatedLetter.reasonText).toBe('Reason text');
  });

  test('updates a letter\'s updatedAt date', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 1, 1));
    await letterRepository.putLetter(createLetter('supplier1', 'letter1', 'PENDING'));
    const originalLetter = await letterRepository.getLetterById('supplier1', 'letter1');
    expect(originalLetter.updatedAt).toBe('2020-02-01T00:00:00.000Z');

    // Month is zero-indexed in JavaScript Date
    // Day is one-indexed
    jest.setSystemTime(new Date(2020, 1, 2));
    const letterDto: LetterDto = {
      id: 'letter1',
      supplierId: 'supplier1',
      status: 'DELIVERED'
    };

    await letterRepository.updateLetterStatus(letterDto);
    const updatedLetter = await letterRepository.getLetterById('supplier1', 'letter1');

    expect(updatedLetter.updatedAt).toBe('2020-02-02T00:00:00.000Z');
  });

  test('can\'t update a letter that does not exist', async () => {
    const letterDto: LetterDto = {
      id: 'letter1',
      supplierId: 'supplier1',
      status: 'DELIVERED'
    };
    await expect(letterRepository.updateLetterStatus(letterDto))
      .rejects.toThrow('Letter with id letter1 not found for supplier supplier1');
  });

  test('update letter status rethrows errors from DynamoDB', async () => {
    const misconfiguredRepository = new LetterRepository(db.docClient, logger, {
      ...db.config,
      lettersTableName: 'nonexistent-table'
    });

    const letterDto: LetterDto = {
      id: 'letter1',
      supplierId: 'supplier1',
      status: 'DELIVERED'
    };
    await expect(misconfiguredRepository.updateLetterStatus(letterDto))
      .rejects.toThrow('Cannot do operations on a non-existent table');
  });

  test('should return a list of letters matching status', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1'));
    await letterRepository.putLetter(createLetter('supplier1', 'letter2'));
    await letterRepository.putLetter(createLetter('supplier1', 'letter3', 'DELIVERED'));

    const pendingLetters = await letterRepository.getLettersByStatus('supplier1', 'PENDING');
    expect(pendingLetters.letters).toHaveLength(2);
    expect(pendingLetters.letters.map(l => l.id)).toEqual(['letter1', 'letter2']);

    const deliveredLetters = await letterRepository.getLettersByStatus('supplier1', 'DELIVERED');
    expect(deliveredLetters.letters).toHaveLength(1);
    expect(deliveredLetters.letters[0].id).toBe('letter3');
  });

  test('letter list should change when letter status is updated', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1'));
    await letterRepository.putLetter(createLetter('supplier1', 'letter2'));

    const pendingLetters = await letterRepository.getLettersByStatus('supplier1', 'PENDING');
    expect(pendingLetters.letters).toHaveLength(2);

    const letterDto: LetterDto = {
      id: 'letter1',
      supplierId: 'supplier1',
      status: 'DELIVERED'
    };
    await letterRepository.updateLetterStatus(letterDto);
    const remainingLetters = await letterRepository.getLettersByStatus('supplier1', 'PENDING');
    expect(remainingLetters.letters).toHaveLength(1);
    expect(remainingLetters.letters[0].id).toBe('letter2');

    const updatedLetters = await letterRepository.getLettersByStatus('supplier1', 'DELIVERED');
    expect(updatedLetters.letters).toHaveLength(1);
    expect(updatedLetters.letters[0].id).toBe('letter1');
  });

  test('letter list should support pagination', async () => {
    for (let i = 1; i <= 99; i++) {
      await letterRepository.putLetter(createLetter('supplier1', `letter${('000' + i).slice(-3)}`));
    }
    const firstPage = await letterRepository.getLettersByStatus('supplier1', 'PENDING');
    expect(firstPage.letters).toHaveLength(50); // Default page size is 50
    expect(firstPage.lastEvaluatedKey).toBeDefined();
    expect(firstPage.letters[0].id).toBe('letter001');
    expect(firstPage.letters[49].id).toBe('letter050');

    const secondPage = await letterRepository.getLettersByStatus('supplier1', 'PENDING', {
      exclusiveStartKey: firstPage.lastEvaluatedKey
    });
    expect(secondPage.letters).toHaveLength(49);
    expect(secondPage.lastEvaluatedKey).toBeUndefined(); // No more pages
    expect(secondPage.letters[0].id).toBe('letter051');
    expect(secondPage.letters[48].id).toBe('letter099');
  });

  test('letter list should return empty when no letters match status', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1', 'ACCEPTED'));
    const page = await letterRepository.getLettersByStatus('supplier1', 'PENDING');
    expect(page.letters).toHaveLength(0);
    expect(page.lastEvaluatedKey).toBeUndefined();
  });

  test('letter list should warn about invalid data', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1'));
    await db.docClient.send(new PutCommand({
      TableName: db.config.lettersTableName,
      Item: {
        supplierId: 'supplier1',
        id: 'invalid-letter',
        // specificationId: 'specification1', // Missing required field
        groupId: 'group1',
        url: 's3://bucket/invalid-letter.pdf',
        status: 'PENDING',
        supplierStatus: 'supplier1#PENDING',
        supplierStatusSk: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }));

    const pendingLetters = await letterRepository.getLettersByStatus('supplier1', 'PENDING');
    expect(pendingLetters.letters).toHaveLength(1);
    expect(pendingLetters.letters[0].id).toBe('letter1');

    expect(logStream.logs).toContainEqual(expect.stringMatching(/.*Invalid letter data:.*/));
    expect(logStream.logs).toContainEqual(expect.stringMatching(/.*specificationId.*Invalid input: expected string.*/));
  });

  test("should return all letters for a supplier status", async () => {
    await letterRepository.putLetter(createLetter("supplier1", "letter1"));
    await letterRepository.putLetter(createLetter("supplier1", "letter2"));
    await letterRepository.putLetter(createLetter("supplier1", "letter3"));
    await letterRepository.putLetter(
      createLetter("supplier1", "letter4", "REJECTED"),
    );
    await letterRepository.putLetter(createLetter("supplier2", "letter1"));
    await letterRepository.putLetter(createLetter("supplier2", "letter2"));

    const letters = await letterRepository.getLettersBySupplier(
      "supplier1",
      "PENDING",
      10,
    );
    expect(letters).toEqual([
      {
        id: "letter1",
        specificationId: "specification1",
        groupId: 'group1',
        status: "PENDING",
      },
      {
        id: "letter2",
        specificationId: "specification1",
        groupId: 'group1',
        status: "PENDING",
      },
      {
        id: "letter3",
        specificationId: "specification1",
        groupId: 'group1',
        status: "PENDING",
      },
    ]);
  });

  test('should return empty if no letters exist for a supplier', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1'));
    await letterRepository.putLetter(createLetter('supplier1', 'letter2'));

    const letters = await letterRepository.getLettersBySupplier('supplier2', 'PENDING', 10);
    expect(letters).toEqual([]);
  });

  test('should return empty if query result Items is null', async () => {
    await letterRepository.putLetter(createLetter('supplier1', 'letter1'));

    const mockSend = jest.fn().mockResolvedValue({ Items: null });
    const mockDdbClient = { send: mockSend } as any;
    const repo = new LetterRepository(mockDdbClient, { debug: jest.fn() } as any, { lettersTableName: 'letters', lettersTtlHours: 1 });

    const letters = await repo.getLettersBySupplier('supplier1', 'PENDING', 10);
    expect(letters).toEqual([]);
  });

  test('should batch write letters to the database', async () => {
    const letters = [
      createLetter('supplier1', 'letter1'),
      createLetter('supplier1', 'letter2'),
      createLetter('supplier1', 'letter3')
    ];

    await letterRepository.putLetterBatch(letters);

    await checkLetterStatus('supplier1', 'letter1', 'PENDING');
    await checkLetterStatus('supplier1', 'letter2', 'PENDING');
    await checkLetterStatus('supplier1', 'letter3', 'PENDING');
  });

  test('should batch in calls upto 25', async () => {
    const letters = []
    for(let i=0; i<60; i++) {
      letters.push(createLetter('supplier1', `letter${i}`));
    }

    const sendSpy = jest.spyOn(db.docClient, 'send');

    await letterRepository.putLetterBatch(letters);

    expect(sendSpy).toHaveBeenCalledTimes(3);

    await checkLetterStatus('supplier1', 'letter1', 'PENDING');
    await checkLetterStatus('supplier1', 'letter6', 'PENDING');
    await checkLetterStatus('supplier1', 'letter59', 'PENDING');
  });

  test('should skip array gaps', async () => {
    const letters = [
      createLetter('supplier1', 'letter1'),
      createLetter('supplier1', 'letter2'),
      createLetter('supplier1', 'letter3')
    ];

    delete letters[1];

    await letterRepository.putLetterBatch(letters);

    await checkLetterStatus('supplier1', 'letter1', 'PENDING');
    await checkLetterStatus('supplier1', 'letter3', 'PENDING');
  });

  test('rethrows errors from DynamoDB when batch creating letter', async () => {
    const misconfiguredRepository = new LetterRepository(db.docClient, logger, {
      ...db.config,
      lettersTableName: 'nonexistent-table'
    });
    await expect(misconfiguredRepository.putLetterBatch([createLetter('supplier1', 'letter1')]))
      .rejects.toThrow('Cannot do operations on a non-existent table');
  });
});
