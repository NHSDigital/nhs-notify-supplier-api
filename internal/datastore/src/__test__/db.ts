import { GenericContainer } from "testcontainers";
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  UpdateTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DatastoreConfig } from "../config";

export async function setupDynamoDBContainer() {
  const container = await new GenericContainer("amazon/dynamodb-local")
    .withExposedPorts(8000)
    .start();

  const endpoint = `http://${container.getHost()}:${container.getMappedPort(8000)}`;

  const ddbClient = new DynamoDBClient({
    region: "us-west-2",
    endpoint,
    credentials: {
      accessKeyId: "fakeMyKeyId",
      secretAccessKey: "fakeSecretAccessKey",
    },
  });

  const docClient = DynamoDBDocumentClient.from(ddbClient);

  const config: DatastoreConfig = {
    region: "us-west-2",
    endpoint,
    lettersTableName: "letters",
    letterQueueTableName: "letter-queue",
    miTableName: "management-info",
    suppliersTableName: "suppliers",
    lettersTtlHours: 1,
    letterQueueTtlHours: 1,
    miTtlHours: 1,
  };

  return {
    container,
    ddbClient,
    docClient,
    endpoint,
    config,
  };
}

export type DBContext = Awaited<ReturnType<typeof setupDynamoDBContainer>>;

const createLetterTableCommand = new CreateTableCommand({
  TableName: "letters",
  BillingMode: "PAY_PER_REQUEST",
  KeySchema: [
    { AttributeName: "id", KeyType: "HASH" }, // Partition key (letter ID)
    { AttributeName: "supplierId", KeyType: "RANGE" }, // Sort key
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "supplierStatus-index",
      KeySchema: [
        { AttributeName: "supplierStatus", KeyType: "HASH" }, // Partition key for GSI
        { AttributeName: "supplierStatusSk", KeyType: "RANGE" }, // Sort key for GSI
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],
  AttributeDefinitions: [
    { AttributeName: "supplierId", AttributeType: "S" },
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "supplierStatus", AttributeType: "S" },
    { AttributeName: "supplierStatusSk", AttributeType: "S" },
  ],
});

const updateTimeToLiveCommand = new UpdateTimeToLiveCommand({
  TableName: "letters",
  TimeToLiveSpecification: {
    AttributeName: "ttl",
    Enabled: true,
  },
});

const createMITableCommand = new CreateTableCommand({
  TableName: "management-info",
  BillingMode: "PAY_PER_REQUEST",
  KeySchema: [
    { AttributeName: "supplierId", KeyType: "HASH" }, // Partition key
    { AttributeName: "id", KeyType: "RANGE" }, // Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: "supplierId", AttributeType: "S" },
    { AttributeName: "id", AttributeType: "S" },
  ],
});

const createSupplierTableCommand = new CreateTableCommand({
  TableName: "suppliers",
  BillingMode: "PAY_PER_REQUEST",
  KeySchema: [
    { AttributeName: "id", KeyType: "HASH" }, // Partition key
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "supplier-apim-index",
      KeySchema: [
        { AttributeName: "apimId", KeyType: "HASH" }, // Partition key for GSI
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "apimId", AttributeType: "S" },
  ],
});

const createLetterQueueTableCommand = new CreateTableCommand({
  TableName: "letter-queue",
  BillingMode: "PAY_PER_REQUEST",
  KeySchema: [
    { AttributeName: "supplierId", KeyType: "HASH" }, // Partition key
    { AttributeName: "letterId", KeyType: "RANGE" }, // Sort key
  ],
  LocalSecondaryIndexes: [
    {
      IndexName: "timestamp-index",
      KeySchema: [
        { AttributeName: "supplierId", KeyType: "HASH" }, // Partition key for LSI
        { AttributeName: "queueTimestamp", KeyType: "RANGE" }, // Sort key for LSI
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],
  AttributeDefinitions: [
    { AttributeName: "supplierId", AttributeType: "S" },
    { AttributeName: "letterId", AttributeType: "S" },
    { AttributeName: "queueTimestamp", AttributeType: "S" },
  ],
});

export async function createTables(context: DBContext) {
  const { ddbClient } = context;

  await ddbClient.send(createLetterTableCommand);
  await ddbClient.send(updateTimeToLiveCommand);

  await ddbClient.send(createMITableCommand);
  await ddbClient.send(createSupplierTableCommand);
  await ddbClient.send(createLetterQueueTableCommand);
}

export async function deleteTables(context: DBContext) {
  const { ddbClient } = context;

  for (const tableName of [
    "letters",
    "management-info",
    "suppliers",
    "letter-queue",
  ]) {
    await ddbClient.send(
      new DeleteTableCommand({
        TableName: tableName,
      }),
    );
  }
}
