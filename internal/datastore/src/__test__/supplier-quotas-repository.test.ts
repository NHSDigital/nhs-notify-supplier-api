import { PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  DBContext,
  createTables,
  deleteTables,
  setupDynamoDBContainer,
} from "./db";
import { SupplierQuotasRepository } from "../supplier-quotas-repository";

function createOverallAllocationItem(
  allocationId: string,
  volumeGroupId: string,
  allocations: Record<string, number>,
) {
  return {
    pk: "ENTITY#overall-allocation",
    sk: `ID#${allocationId}`,
    id: allocationId,
    volumeGroup: volumeGroupId,
    allocations,
    updatedAt: new Date().toISOString(),
  };
}

function createDailyAllocationItem(
  allocationId: string,
  date: string,
  allocations: Record<string, number>,
) {
  return {
    pk: "ENTITY#daily-allocation",
    sk: `ID#${date}`,
    id: allocationId,
    date,
    allocations,
    updatedAt: new Date().toISOString(),
  };
}

jest.setTimeout(30_000);

describe("SupplierQuotasRepository", () => {
  let dbContext: DBContext;
  let repository: SupplierQuotasRepository;
  let mockDdbClient: {
    send: jest.Mock;
    config: any;
    destroy: jest.Mock;
    middlewareStack: any;
  };

  // Database tests can take longer, especially with setup and teardown
  beforeAll(async () => {
    dbContext = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(dbContext);
    repository = new SupplierQuotasRepository(dbContext.docClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });
    // Initialize mockDdbClient for tests that need it
    mockDdbClient = {
      send: jest.fn(),
      config: {},
      destroy: jest.fn(),
      middlewareStack: {
        clone: jest.fn(),
        use: jest.fn(),
        remove: jest.fn(),
        removeByTag: jest.fn(),
        concat: jest.fn(),
      },
    };
  });

  afterEach(async () => {
    await deleteTables(dbContext);
    jest.useRealTimers();
  });

  afterAll(async () => {
    await dbContext.container.stop();
  });

  test("getOverallAllocation returns correct allocation for existing group", async () => {
    const volumeGroupId = "group-123";
    const allocations = { supplier1: 100, supplier2: 200 };
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierQuotasTableName,
        Item: createOverallAllocationItem(
          volumeGroupId,
          volumeGroupId,
          allocations,
        ),
      }),
    );

    const result = await repository.getOverallAllocation(volumeGroupId);

    expect(result).toEqual({
      id: volumeGroupId,
      volumeGroup: volumeGroupId,
      allocations,
    });
  });

  test("getOverallAllocation returns undefined for non-existent group", async () => {
    const volumeGroupId = "non-existent-group";

    const result = await repository.getOverallAllocation(volumeGroupId);

    expect(result).toBeUndefined();
  });

  test("updateOverallAllocation creates new allocation when none exists", async () => {
    const volumeGroupId = "group-123";
    const supplierId = "supplier-123";
    const newAllocation = 50;

    await repository.updateOverallAllocation(
      volumeGroupId,
      supplierId,
      newAllocation,
    );

    const result = await repository.getOverallAllocation(volumeGroupId);
    expect(result).toEqual({
      id: volumeGroupId,
      volumeGroup: volumeGroupId,
      allocations: { [supplierId]: newAllocation },
    });
  });

  test("updateOverallAllocation updates existing allocation", async () => {
    const volumeGroupId = "group-123";
    const supplierId = "supplier-123";
    const initialAllocations = { [supplierId]: 100 };
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierQuotasTableName,
        Item: createOverallAllocationItem(
          volumeGroupId,
          volumeGroupId,
          initialAllocations,
        ),
      }),
    );

    const newAllocation = 50;
    await repository.updateOverallAllocation(
      volumeGroupId,
      supplierId,
      newAllocation,
    );

    const result = await repository.getOverallAllocation(volumeGroupId);
    const resultMap = new Map(Object.entries(result?.allocations ?? {}));
    expect(resultMap.get(supplierId)).toBe(150);
  });

  test("updateOverallAllocation throws error for non-validation exceptions", async () => {
    const volumeGroupId = "group-123";
    const supplierId = "supplier-123";
    const newAllocation = 50;

    // Mock the ddbClient to throw a generic error
    mockDdbClient.send.mockRejectedValue(new Error("Generic error"));

    const repoWithMockedClient = new SupplierQuotasRepository(mockDdbClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });

    await expect(
      repoWithMockedClient.updateOverallAllocation(
        volumeGroupId,
        supplierId,
        newAllocation,
      ),
    ).rejects.toThrow("Generic error");
  });

  test("updateOverallAllocation calls increment twice if Putcommand fails with  ConditionalCheckFailedException", async () => {
    const volumeGroupId = "group-123";
    const supplierId = "supplier-123";
    const newAllocation = 50;

    // Mock the ddbClient to throw a validation e first call and throw ConditionalCheckFailedException on the second call and then succeed on the third call
    mockDdbClient.send
      .mockRejectedValueOnce(
        Object.assign(new Error("Validation error"), {
          name: "ValidationException",
        }),
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("ConditionalCheckFailedException"), {
          name: "ConditionalCheckFailedException",
        }),
      )
      .mockResolvedValue({}); // Succeed on the third call

    const repoWithMockedClient = new SupplierQuotasRepository(mockDdbClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });

    await repoWithMockedClient.updateOverallAllocation(
      volumeGroupId,
      supplierId,
      newAllocation,
    );

    expect(mockDdbClient.send).toHaveBeenCalledTimes(3);
    expect(mockDdbClient.send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        input: expect.objectContaining({
          UpdateExpression: expect.stringContaining("SET"),
        }),
      }),
    );
    expect(mockDdbClient.send).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        input: expect.objectContaining({
          UpdateExpression: expect.stringContaining("SET"),
        }),
      }),
    );
  });

  test("updateOverallAllocation throw exception if Putcommand fails with any error other than ConditionalCheckFailedException", async () => {
    const volumeGroupId = "group-123";
    const supplierId = "supplier-123";
    const newAllocation = 50;

    // Mock the ddbClient to throw a generic error
    mockDdbClient.send
      .mockRejectedValueOnce(
        Object.assign(new Error("Validation error"), {
          name: "ValidationException",
        }),
      )
      .mockRejectedValueOnce(new Error("Generic error")); // Throw a generic error on the second call

    const repoWithMockedClient = new SupplierQuotasRepository(mockDdbClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });

    await expect(
      repoWithMockedClient.updateOverallAllocation(
        volumeGroupId,
        supplierId,
        newAllocation,
      ),
    ).rejects.toThrow("Generic error");
  });

  test("getDailyAllocation returns correct allocation for existing group and date", async () => {
    const allocationId = "daily-allocation-123";
    const date = "2023-10-01";
    const allocations = { supplier1: 50, supplier2: 75 };
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierQuotasTableName,
        Item: createDailyAllocationItem(allocationId, date, allocations),
      }),
    );

    const result = await repository.getDailyAllocation(date);

    expect(result).toEqual({
      id: allocationId,
      date,
      allocations,
    });
  });

  test("getDailyAllocation returns undefined for non-existent date", async () => {
    const date = "2023-09-01";

    const result = await repository.getDailyAllocation(date);

    expect(result).toBeUndefined();
  });

  test("updateDailyAllocation creates new allocation when none exists", async () => {
    const date = "2023-10-01";
    const supplierId = "supplier-123";
    const newAllocation = 25;

    await repository.updateDailyAllocation(date, supplierId, newAllocation);

    const result = await repository.getDailyAllocation(date);
    expect(result).toEqual({
      id: `ID#${date}`,
      date,
      allocations: { [supplierId]: newAllocation },
    });
  });

  test("updateDailyAllocation updates existing allocation", async () => {
    const allocationId = "daily-allocation-123";
    const date = "2023-10-01";
    const supplierId = "supplier-123";
    const initialAllocations = { [supplierId]: 50 };
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierQuotasTableName,
        Item: createDailyAllocationItem(allocationId, date, initialAllocations),
      }),
    );

    const newAllocation = 25;
    await repository.updateDailyAllocation(date, supplierId, newAllocation);

    const result = await repository.getDailyAllocation(date);
    const resultMap = new Map(Object.entries(result?.allocations ?? {}));
    expect(resultMap.get(supplierId)).toBe(75);
  });

  test("updateDailyAllocation throws error for non-validation exceptions", async () => {
    const date = "2023-10-01";
    const supplierId = "supplier-123";
    const newAllocation = 25;

    // Mock the ddbClient to throw a generic error
    mockDdbClient.send.mockRejectedValue(new Error("Generic error"));

    const repoWithMockedClient = new SupplierQuotasRepository(mockDdbClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });

    await expect(
      repoWithMockedClient.updateDailyAllocation(
        date,
        supplierId,
        newAllocation,
      ),
    ).rejects.toThrow("Generic error");
  });

  test("updateDailyAllocation calls increment twice if Putcommand fails with  ConditionalCheckFailedException", async () => {
    const date = "2023-10-01";
    const supplierId = "supplier-123";
    const newAllocation = 25;

    // Mock the ddbClient to throw a validation e first call and throw ConditionalCheckFailedException on the second call and then succeed on the third call
    mockDdbClient.send
      .mockRejectedValueOnce(
        Object.assign(new Error("Validation error"), {
          name: "ValidationException",
        }),
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("ConditionalCheckFailedException"), {
          name: "ConditionalCheckFailedException",
        }),
      )
      .mockResolvedValue({}); // Succeed on the third call

    const repoWithMockedClient = new SupplierQuotasRepository(mockDdbClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });

    await repoWithMockedClient.updateDailyAllocation(
      date,
      supplierId,
      newAllocation,
    );

    expect(mockDdbClient.send).toHaveBeenCalledTimes(3);
    expect(mockDdbClient.send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        input: expect.objectContaining({
          UpdateExpression: expect.stringContaining("SET"),
        }),
      }),
    );
    expect(mockDdbClient.send).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        input: expect.objectContaining({
          UpdateExpression: expect.stringContaining("SET"),
        }),
      }),
    );
  });

  test("updateDailyAllocation throw exception if Putcommand fails with any error other than ConditionalCheckFailedException", async () => {
    const date = "2023-10-01";
    const supplierId = "supplier-123";
    const newAllocation = 25;

    // Mock the ddbClient to throw a generic error
    mockDdbClient.send
      .mockRejectedValueOnce(
        Object.assign(new Error("Validation error"), {
          name: "ValidationException",
        }),
      )
      .mockRejectedValueOnce(new Error("Generic error")); // Throw a generic error on the second call

    const repoWithMockedClient = new SupplierQuotasRepository(mockDdbClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });

    await expect(
      repoWithMockedClient.updateDailyAllocation(
        date,
        supplierId,
        newAllocation,
      ),
    ).rejects.toThrow("Generic error");
  });
});
