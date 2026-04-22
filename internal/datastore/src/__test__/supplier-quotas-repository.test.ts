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
  volumeGroupId: string,
  date: string,
  allocations: Record<string, number>,
) {
  return {
    pk: "ENTITY#daily-allocation",
    sk: `ID#${volumeGroupId}#DATE#${date}`,
    id: allocationId,
    volumeGroup: volumeGroupId,
    date,
    allocations,
    updatedAt: new Date().toISOString(),
  };
}

jest.setTimeout(30_000);

describe("SupplierQuotasRepository", () => {
  let dbContext: DBContext;
  let repository: SupplierQuotasRepository;

  // Database tests can take longer, especially with setup and teardown
  beforeAll(async () => {
    dbContext = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(dbContext);
    repository = new SupplierQuotasRepository(dbContext.docClient, {
      supplierQuotasTableName: dbContext.config.supplierQuotasTableName,
    });
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

  test("putOverallAllocation stores allocation correctly", async () => {
    const allocation = {
      id: "group-123",
      volumeGroup: "group-123",
      allocations: { supplier1: 100, supplier2: 200 },
    };

    await repository.putOverallAllocation(allocation);

    const result = await repository.getOverallAllocation("group-123");
    expect(result).toEqual(allocation);
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
    expect(result?.allocations[supplierId]).toBe(150);
  });

  test("getDailyAllocation returns correct allocation for existing group and date", async () => {
    const allocationId = "daily-allocation-123";
    const volumeGroupId = "group-123";
    const date = "2023-10-01";
    const allocations = { supplier1: 50, supplier2: 75 };
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierQuotasTableName,
        Item: createDailyAllocationItem(
          allocationId,
          volumeGroupId,
          date,
          allocations,
        ),
      }),
    );

    const result = await repository.getDailyAllocation(volumeGroupId, date);

    expect(result).toEqual({
      id: allocationId,
      volumeGroup: volumeGroupId,
      date,
      allocations,
    });
  });

  test("getDailyAllocation returns undefined for non-existent group and date", async () => {
    const volumeGroupId = "non-existent-group";
    const date = "2023-10-01";

    const result = await repository.getDailyAllocation(volumeGroupId, date);

    expect(result).toBeUndefined();
  });

  test("putDailyAllocation stores allocation correctly", async () => {
    const allocation = {
      id: "daily-allocation-123",
      volumeGroup: "group-123",
      date: "2023-10-01",
      allocations: { supplier1: 50, supplier2: 75 },
    };

    await repository.putDailyAllocation(allocation);

    const result = await repository.getDailyAllocation(
      "group-123",
      "2023-10-01",
    );
    expect(result).toEqual(allocation);
  });

  test("updateDailyAllocation creates new allocation when none exists", async () => {
    const volumeGroupId = "group-123";
    const date = "2023-10-01";
    const supplierId = "supplier-123";
    const newAllocation = 25;

    await repository.updateDailyAllocation(
      volumeGroupId,
      date,
      supplierId,
      newAllocation,
    );

    const result = await repository.getDailyAllocation(volumeGroupId, date);
    expect(result).toEqual({
      id: `${volumeGroupId}#DATE#${date}`,
      volumeGroup: volumeGroupId,
      date,
      allocations: { [supplierId]: newAllocation },
    });
  });

  test("updateDailyAllocation updates existing allocation", async () => {
    const allocationId = "daily-allocation-123";
    const volumeGroupId = "group-123";
    const date = "2023-10-01";
    const supplierId = "supplier-123";
    const initialAllocations = { [supplierId]: 50 };
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierQuotasTableName,
        Item: createDailyAllocationItem(
          allocationId,
          volumeGroupId,
          date,
          initialAllocations,
        ),
      }),
    );

    const newAllocation = 25;
    await repository.updateDailyAllocation(
      volumeGroupId,
      date,
      supplierId,
      newAllocation,
    );

    const result = await repository.getDailyAllocation(volumeGroupId, date);
    expect(result?.allocations[supplierId]).toBe(75);
  });
});
