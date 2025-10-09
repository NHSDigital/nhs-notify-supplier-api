import { GenericContainer } from 'testcontainers';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  UpdateTimeToLiveCommand
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DatastoreConfig } from '../config';

export async function setupDynamoDBContainer() {
  const container = await new GenericContainer('amazon/dynamodb-local')
    .withExposedPorts(8000)
    .start();

  const endpoint = `http://${container.getHost()}:${container.getMappedPort(8000)}`;

  const ddbClient = new DynamoDBClient({
    region: 'us-west-2',
    endpoint,
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey'
    }
  });

  const docClient = DynamoDBDocumentClient.from(ddbClient);

  const config : DatastoreConfig = {
    region: 'us-west-2',
    endpoint,
    lettersTableName: 'letters',
    miTableName: 'management-info',
    ttlHours: 1
  };

  return {
    container,
    ddbClient,
    docClient,
    endpoint,
    config
  };
}

export type DBContext = Awaited<ReturnType<typeof setupDynamoDBContainer>>;

const createLetterTableCommand = new CreateTableCommand({
    TableName: 'letters',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'supplierId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'id', KeyType: 'RANGE' }         // Sort key
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'supplierStatus-index',
        KeySchema: [
          { AttributeName: 'supplierStatus', KeyType: 'HASH' }, // Partition key for GSI
          { AttributeName: 'supplierStatusSk', KeyType: 'RANGE' }              // Sort key for GSI
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    AttributeDefinitions: [
      { AttributeName: 'supplierId', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'supplierStatus', AttributeType: 'S' },
      { AttributeName: 'supplierStatusSk', AttributeType: 'S' },
    ]
  });

const updateTimeToLiveCommand = new UpdateTimeToLiveCommand({
    TableName: 'letters',
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  });

const createMITableCommand = new CreateTableCommand({
    TableName: 'management-info',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'supplierId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'id', KeyType: 'RANGE' }         // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'supplierId', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' },
    ]
  });


export async function createTables(context: DBContext) {
  const { ddbClient } = context;

  await ddbClient.send(createLetterTableCommand);
  await ddbClient.send(updateTimeToLiveCommand);

  await ddbClient.send(createMITableCommand);
}


export async function deleteTables(context: DBContext) {
  const { ddbClient } = context;

  await ddbClient.send(new DeleteTableCommand({
    TableName: 'letters'
  }));

  await ddbClient.send(new DeleteTableCommand({
    TableName: 'management-info'
  }));
}
