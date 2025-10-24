import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import pino from 'pino';
import { LetterRepository, DBHealthcheck } from '../../../../internal/datastore';
import { envVars, EnvVars } from "../config/env";

export type Deps = {
  s3Client: S3Client;
  letterRepo: LetterRepository;
  dbHealthcheck: DBHealthcheck;
  logger: pino.Logger;
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

function createDBHealthcheck(envVars: EnvVars): DBHealthcheck {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    ttlHours: envVars.LETTER_TTL_HOURS
  };

  return new DBHealthcheck(docClient, config);
}

export function createDependenciesContainer(): Deps {

  const log = pino();

  return {
    s3Client: new S3Client(),
    letterRepo: createLetterRepository(log, envVars),
    dbHealthcheck: createDBHealthcheck(envVars),
    logger: log,
    env: envVars
  };
}
