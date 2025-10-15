import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import pino from 'pino';
import { MIRepository } from '../../../../internal/datastore/src';


export function createMIRepository(): MIRepository {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const log = pino();
  const config = {
    miTableName: process.env.MI_TABLE_NAME!,
  };

  return new MIRepository(docClient, log, config);
}
