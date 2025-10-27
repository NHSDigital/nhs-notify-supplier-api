import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import pino from 'pino';
import { LetterRepository } from '@internal/datastore';
import { envVars, EnvVars } from "./env";

export type Deps = {
  s3Client: S3Client;
  letterRepo: LetterRepository;
  logger: pino.Logger,
  env: EnvVars
};

function createLetterRepository(log: pino.Logger, envVars: EnvVars): LetterRepository {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    ttlHours: envVars.LETTER_TTL_HOURS
  };

  return new LetterRepository(docClient, log, config);
}

export function createDependenciesContainer(): Deps {

  const log = pino();

  return {
    s3Client: new S3Client(),
    letterRepo: createLetterRepository(log, envVars),
    logger: log,
    env: envVars
  };
}
