import { Logger } from "pino";
import { randomUUID } from "node:crypto";
import {
  DBContext,
  createTables,
  deleteTables,
  setupDynamoDBContainer,
} from "./db";
import { createTestLogger } from "./logs";
import { SupplierRepository } from "../supplier-repository";
import { Supplier } from "../types";

function createSupplier(
  status: "ENABLED" | "DISABLED",
  apimId = randomUUID(),
): Omit<Supplier, "updatedAt"> {
  return {
    id: randomUUID(),
    name: "Supplier One",
    apimId,
    status,
  };
}

// Database tests can take longer, especially with setup and teardown
jest.setTimeout(30_000);

describe("SupplierRepository", () => {
  let db: DBContext;
  let supplierRepository: SupplierRepository;
  let logger: Logger;

  beforeAll(async () => {
    db = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(db);
    ({ logger } = createTestLogger());

    supplierRepository = new SupplierRepository(
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

  test("creates an enabled supplier with provided values and timestamps", async () => {
    jest.useFakeTimers();
    // Month is zero-indexed in JS Date
    jest.setSystemTime(new Date(2020, 1, 1));

    const supplier = createSupplier("ENABLED");

    const persistedSupplier = await supplierRepository.putSupplier(supplier);

    expect(persistedSupplier).toEqual(
      expect.objectContaining({
        ...supplier,
        updatedAt: "2020-02-01T00:00:00.000Z",
      }),
    );
  });

  test("fetches a supplier by its ID", async () => {
    const supplier = createSupplier("DISABLED");
    await supplierRepository.putSupplier(supplier);

    const fetched = await supplierRepository.getSupplierById(supplier.id);

    expect(fetched).toEqual(
      expect.objectContaining({
        ...supplier,
      }),
    );
  });

  test("throws an error fetching a supplier that does not exist", async () => {
    await expect(
      supplierRepository.getSupplierById("non-existent-id"),
    ).rejects.toThrow("Supplier with id non-existent-id not found");
  });

  test("overwrites an existing supplier entry", async () => {
    const supplier = createSupplier("DISABLED");

    const original = await supplierRepository.putSupplier(supplier);
    expect(original.status).toBe("DISABLED");

    supplier.status = "ENABLED";
    const updated = await supplierRepository.putSupplier(supplier);
    expect(updated.status).toBe("ENABLED");
  });

  test("rethrows errors from DynamoDB when creating a letter", async () => {
    const misconfiguredRepository = new SupplierRepository(
      db.docClient,
      logger,
      {
        ...db.config,
        suppliersTableName: "nonexistent-table",
      },
    );
    await expect(
      misconfiguredRepository.putSupplier(createSupplier("ENABLED")),
    ).rejects.toThrow("Cannot do operations on a non-existent table");
  });

  test("fetches a supplier by apimId", async () => {
    const supplier = createSupplier("ENABLED");

    await supplierRepository.putSupplier(supplier);

    const fetched = await supplierRepository.getSupplierByApimId(
      supplier.apimId,
    );
    expect(fetched).toEqual(
      expect.objectContaining({
        ...supplier,
      }),
    );
  });

  test("throws an error fetching a supplier by apimId that does not exist", async () => {
    await expect(
      supplierRepository.getSupplierByApimId("non-existent-apim-id"),
    ).rejects.toThrow("Supplier with apimId non-existent-apim-id not found");
  });

  test("throws an error fetching a supplier by apimId when multiple exist", async () => {
    const apimId = randomUUID();
    const supplier1 = createSupplier("ENABLED", apimId);
    const supplier2 = createSupplier("DISABLED", apimId);

    await supplierRepository.putSupplier(supplier1);
    await supplierRepository.putSupplier(supplier2);

    await expect(
      supplierRepository.getSupplierByApimId(apimId),
    ).rejects.toThrow(`Multiple suppliers found with apimId ${apimId}`);
  });
});
