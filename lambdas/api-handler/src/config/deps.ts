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

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}


function createLetterRepository(documentClient: DynamoDBDocumentClient, log: pino.Logger, envVars: EnvVars): LetterRepository {
  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    ttlHours: envVars.LETTER_TTL_HOURS
  };

  return new LetterRepository(documentClient, log, config);
}

function createDBHealthcheck(documentClient: DynamoDBDocumentClient, envVars: EnvVars): DBHealthcheck {
  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    ttlHours: envVars.LETTER_TTL_HOURS
  };

  return new DBHealthcheck(documentClient, config);
}

export function createDependenciesContainer(): Deps {

  const log = pino();
  const documentClient = createDocumentClient();

  return {
    s3Client: new S3Client(),
    letterRepo: createLetterRepository(documentClient, log, envVars),
    dbHealthcheck: createDBHealthcheck(documentClient, envVars),
    logger: log,
    env: envVars
  };
}
