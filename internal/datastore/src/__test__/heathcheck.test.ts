import DBHealthcheck from "../healthcheck";
import {
  DBContext,
  createTables,
  deleteTables,
  setupDynamoDBContainer,
} from "./db";

// Database tests can take longer, especially with setup and teardown
jest.setTimeout(30_000);

describe("DBHealthcheck", () => {
  let db: DBContext;

  beforeAll(async () => {
    db = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(db);
  });

  afterEach(async () => {
    await deleteTables(db);
  });

  afterAll(async () => {
    await db.container.stop();
  });

  it("passes when the database is available", async () => {
    const dbHealthCheck = new DBHealthcheck(db.docClient, db.config);
    await expect(dbHealthCheck.check()).resolves.not.toThrow();
  });

  it("fails when the database is unavailable", async () => {
    const realFunction = db.docClient.send;
    db.docClient.send = jest.fn().mockImplementation(() => {
      throw new Error("Failed to send");
    });

    const dbHealthCheck = new DBHealthcheck(db.docClient, db.config);
    await expect(dbHealthCheck.check()).rejects.toThrow();

    db.docClient.send = realFunction;
  });
});
