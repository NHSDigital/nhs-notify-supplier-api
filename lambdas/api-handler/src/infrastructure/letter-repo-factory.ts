import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import pino from 'pino';
import { LetterRepository } from '../../../../internal/datastore';

const BASE_TEN = 10;

export function createLetterRepository(): LetterRepository {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const log = pino();
  const config = {
    lettersTableName: process.env.LETTERS_TABLE_NAME!,
    ttlHours: parseInt(process.env.LETTER_TTL_HOURS!, BASE_TEN),
  };

  return new LetterRepository(docClient, log, config);
}
