import { PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  DBContext,
  createTables,
  deleteTables,
  setupDynamoDBContainer,
} from "./db";
import { SupplierConfigRepository } from "../supplier-config-repository";

function createLetterVariantItem(variantId: string) {
  return {
    pk: "ENTITY#letter-variant",
    sk: `ID#${variantId}`,
    id: variantId,
    name: `Variant ${variantId}`,
    description: `Description for variant ${variantId}`,
    type: "STANDARD",
    status: "PROD",
    volumeGroupId: `group-${variantId}`,
    packSpecificationIds: [`pack-spec-${variantId}`],
  };
}

function createVolumeGroupItem(groupId: string, status = "PROD") {
  const startDate = new Date(Date.now() - 24 * 1000 * 60 * 60)
    .toISOString()
    .split("T")[0]; // Started a day ago to ensure it's active based on start date. Tests can override this if needed.
  const endDate = new Date(Date.now() + 24 * 1000 * 60 * 60)
    .toISOString()
    .split("T")[0]; // Ends in a day to ensure it's active based on end date. Tests can override this if needed.
  return {
    pk: "ENTITY#volume-group",
    sk: `ID#${groupId}`,
    id: groupId,
    name: `Volume Group ${groupId}`,
    description: `Description for volume group ${groupId}`,
    status,
    startDate,
    endDate,
  };
}

function createSupplierAllocationItem(
  allocationId: string,
  groupId: string,
  supplier: string,
) {
  return {
    pk: "ENTITY#supplier-allocation",
    sk: `ID#${allocationId}`,
    id: allocationId,
    status: "PROD",
    volumeGroup: groupId,
    supplier,
    allocationPercentage: 50,
  };
}

function createSupplierItem(supplierId: string) {
  return {
    pk: "ENTITY#supplier",
    sk: `ID#${supplierId}`,
    id: supplierId,
    name: `Supplier ${supplierId}`,
    channelType: "LETTER",
    dailyCapacity: 1000,
    status: "PROD",
  };
}

jest.setTimeout(30_000);

describe("SupplierConfigRepository", () => {
  let dbContext: DBContext;
  let repository: SupplierConfigRepository;

  // Database tests can take longer, especially with setup and teardown
  beforeAll(async () => {
    dbContext = await setupDynamoDBContainer();
  });

  beforeEach(async () => {
    await createTables(dbContext);
    repository = new SupplierConfigRepository(
      dbContext.docClient,
      dbContext.config,
    );
  });

  afterEach(async () => {
    await deleteTables(dbContext);
    jest.useRealTimers();
  });

  afterAll(async () => {
    await dbContext.container.stop();
  });

  test("getLetterVariant returns correct details for existing variant", async () => {
    const variantId = "variant-123";
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: createLetterVariantItem(variantId),
      }),
    );

    const result = await repository.getLetterVariant(variantId);

    expect(result.id).toBe(variantId);
    expect(result.name).toBe(`Variant ${variantId}`);
    expect(result.description).toBe(`Description for variant ${variantId}`);
    expect(result.type).toBe("STANDARD");
    expect(result.status).toBe("PROD");
    expect(result.volumeGroupId).toBe(`group-${variantId}`);
    expect(result.packSpecificationIds).toEqual([`pack-spec-${variantId}`]);
  });

  test("getLetterVariant throws error for non-existent variant", async () => {
    const variantId = "non-existent-variant";

    await expect(repository.getLetterVariant(variantId)).rejects.toThrow(
      `No letter variant details found for id ${variantId}`,
    );
  });

  test("getVolumeGroup returns correct details for existing group", async () => {
    const groupId = "group-123";
    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: createVolumeGroupItem(groupId),
      }),
    );

    const result = await repository.getVolumeGroup(groupId);

    expect(result.id).toBe(groupId);
    expect(result.name).toBe(`Volume Group ${groupId}`);
    expect(result.description).toBe(`Description for volume group ${groupId}`);
    expect(result.status).toBe("PROD");
    expect(new Date(result.startDate).getTime()).toBeLessThan(Date.now());
    expect(new Date(result.endDate!).getTime()).toBeGreaterThan(Date.now());
  });

  test("getVolumeGroup throws error for non-existent group", async () => {
    const groupId = "non-existent-group";

    await expect(repository.getVolumeGroup(groupId)).rejects.toThrow(
      `No volume group details found for id ${groupId}`,
    );
  });

  test("getSupplierAllocationsForVolumeGroup returns correct allocations", async () => {
    const allocationId = "allocation-123";
    const groupId = "group-123";
    const supplierId = "supplier-123";

    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: createSupplierAllocationItem(allocationId, groupId, supplierId),
      }),
    );

    const result =
      await repository.getSupplierAllocationsForVolumeGroup(groupId);

    expect(result).toEqual([
      {
        id: allocationId,
        status: "PROD",
        volumeGroup: groupId,
        supplier: supplierId,
        allocationPercentage: 50,
      },
    ]);
  });

  test("getSupplierAllocationsForVolumeGroup returns multiple allocations", async () => {
    const allocationId1 = "allocation-123";
    const allocationId2 = "allocation-456";
    const groupId = "group-123";
    const supplierId1 = "supplier-123";
    const supplierId2 = "supplier-456";

    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: createSupplierAllocationItem(allocationId1, groupId, supplierId1),
      }),
    );

    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: createSupplierAllocationItem(allocationId2, groupId, supplierId2),
      }),
    );

    const result =
      await repository.getSupplierAllocationsForVolumeGroup(groupId);

    // order of allocations should not matter, just that both are present
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        {
          id: allocationId1,
          status: "PROD",
          volumeGroup: groupId,
          supplier: supplierId1,
          allocationPercentage: 50,
        },
        {
          id: allocationId2,
          status: "PROD",
          volumeGroup: groupId,
          supplier: supplierId2,
          allocationPercentage: 50,
        },
      ]),
    );
  });

  test("getSupplierAllocationsForVolumeGroup throws error for non-existent group", async () => {
    const groupId = "non-existent-group";

    await expect(
      repository.getSupplierAllocationsForVolumeGroup(groupId),
    ).rejects.toThrow(
      `No active supplier allocations found for volume group id ${groupId}`,
    );
  });

  test("getSuppliersDetails returns correct supplier details", async () => {
    const supplierId = "supplier-123";

    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: createSupplierItem(supplierId),
      }),
    );

    const result = await repository.getSuppliersDetails([supplierId]);

    expect(result).toEqual([
      {
        id: supplierId,
        name: `Supplier ${supplierId}`,
        channelType: "LETTER",
        dailyCapacity: 1000,
        status: "PROD",
      },
    ]);
  });

  test("getSuppliersDetails throws error for non-existent supplier", async () => {
    const supplierId = "non-existent-supplier";

    await expect(repository.getSuppliersDetails([supplierId])).rejects.toThrow(
      `Supplier with id ${supplierId} not found`,
    );
  });

  test("getSupplierPacksForPackSpecification returns correct supplier packs", async () => {
    const packSpecId = "pack-spec-123";
    const supplierId = "supplier-123";
    const supplierPackId = "supplier-pack-123";

    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: {
          PK: "SUPPLIER_PACK",
          SK: supplierPackId,
          id: supplierPackId,
          packSpecificationId: packSpecId,
          supplierId,
          status: "PROD",
          approval: "APPROVED",
        },
      }),
    );

    const result =
      await repository.getSupplierPacksForPackSpecification(packSpecId);
    expect(result).toEqual([
      {
        approval: "APPROVED",
        id: supplierPackId,
        packSpecificationId: packSpecId,
        supplierId,
        status: "PROD",
      },
    ]);
  });

  test("getSupplierPacksForPackSpecification returns empty array for non-existent pack specification", async () => {
    const packSpecId = "non-existent-pack-spec";
    const result =
      await repository.getSupplierPacksForPackSpecification(packSpecId);
    expect(result).toEqual([]);
  });

  test("getPackSpecification returns correct pack specification details", async () => {
    const packSpecId = "pack-spec-123";

    await dbContext.docClient.send(
      new PutCommand({
        TableName: dbContext.config.supplierConfigTableName,
        Item: {
          PK: "PACK_SPECIFICATION",
          SK: packSpecId,
          id: packSpecId,
          name: `Pack Specification ${packSpecId}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          billingId: `billing-${packSpecId}`,
          postage: { id: "postageId", size: "STANDARD" },
          status: "PROD",
        },
      }),
    );

    const result = await repository.getPackSpecification(packSpecId);
    expect(result).toEqual({
      billingId: `billing-${packSpecId}`,
      createdAt: expect.any(String),
      id: packSpecId,
      name: `Pack Specification ${packSpecId}`,
      postage: { id: "postageId", size: "STANDARD" },
      updatedAt: expect.any(String),
      version: 1,
      status: "PROD",
    });
  });

  test("getPackSpecification throws error for non-existent pack specification", async () => {
    const packSpecId = "non-existent-pack-spec";

    await expect(repository.getPackSpecification(packSpecId)).rejects.toThrow(
      `No pack specification found for id ${packSpecId}`,
    );
  });
});
