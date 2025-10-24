import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DBHealthcheck } from "../healthcheck";
import { createTables, DBContext, deleteTables, setupDynamoDBContainer } from "./db";

// Database tests can take longer, especially with setup and teardown
jest.setTimeout(30000);

describe('DBHealthcheck', () => {

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

  it('passes when the database is available', async () => {
    const dbHealthCheck = new DBHealthcheck(db.docClient, db.config);
    await dbHealthCheck.check();
  });

  it('fails when the database is unavailable', async () => {
    const realFunction = db.docClient.send;
    db.docClient.send = jest.fn().mockImplementation(() => { throw new Error('Failed to send')});

    const dbHealthCheck = new DBHealthcheck(db.docClient, db.config);
    await expect(dbHealthCheck.check()).rejects.toThrow();

    db.docClient.send = realFunction;
  });
});
