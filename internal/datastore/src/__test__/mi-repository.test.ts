import { Logger } from "pino";
import { setupDynamoDBContainer, createTables, DBContext, deleteTables } from "./db";
import { createTestLogger, LogStream } from "./logs";
import { MIRepository } from "../mi-repository";

// Database tests can take longer, especially with setup and teardown
jest.setTimeout(30000);


describe('MiRepository', () => {
  let db: DBContext;
  let miRepository: MIRepository;
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

    miRepository = new MIRepository(db.docClient, logger, db.config);
  });

  afterEach(async () => {
    await deleteTables(db);
    jest.useRealTimers();
  });

  afterAll(async () => {
    await db.container.stop();
  });

  describe('putMi', () => {

    it('creates a letter with id and timestamps', async () => {

      jest.useFakeTimers();
      // Month is zero-indexed in JS Date
      jest.setSystemTime(new Date(2020, 1, 1));
      const mi = {
        specificationId: 'spec1',
        supplierId: 'supplier1',
        groupId:'group1',
        lineItem: 'item1',
        quantity: 12,
        timestamp: new Date().toISOString(),
        stockRemaining: 0
      };

      const persistedMi = await(miRepository.putMI(mi));

      expect(persistedMi).toEqual(expect.objectContaining({
        id: expect.any(String),
        createdAt: '2020-02-01T00:00:00.000Z',
        updatedAt: '2020-02-01T00:00:00.000Z',
        ...mi
      }));
    });
  });
});
