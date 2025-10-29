import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import pino from 'pino';
import { LetterRepository } from '@internal/datastore';

export function createLetterRepository(environment: string, ttlHours:number): LetterRepository {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const log = pino();
  const config = {
    lettersTableName: `nhs-${environment}-supapi-letters`,
    ttlHours: ttlHours,
  };

  return new LetterRepository(docClient, log, config);
}
