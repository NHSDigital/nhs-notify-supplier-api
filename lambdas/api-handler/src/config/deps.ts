import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from "@aws-sdk/client-sqs";
import pino from 'pino';
import { LetterRepository, MIRepository } from '../../../../internal/datastore';
import { envVars, EnvVars } from "../config/env";

export type Deps = {
  s3Client: S3Client;
  sqsClient: SQSClient;
  letterRepo: LetterRepository;
  miRepo: MIRepository;
  logger: pino.Logger;
  env: EnvVars
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createLetterRepository(log: pino.Logger, envVars: EnvVars): LetterRepository {

  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    lettersTtlHours: envVars.LETTER_TTL_HOURS
  };

  return new LetterRepository(createDocumentClient(), log, config);
}

function createMIRepository(log: pino.Logger, envVars: EnvVars): MIRepository {

  const config = {
    miTableName: envVars.MI_TABLE_NAME,
    miTtlHours: envVars.MI_TTL_HOURS
  };

  return new MIRepository(createDocumentClient(), log, config);
}

export function createDependenciesContainer(): Deps {

  const log = pino();

  return {
    s3Client: new S3Client(),
    sqsClient: new SQSClient(),
    letterRepo: createLetterRepository(log, envVars),
    miRepo: createMIRepository(log, envVars),
    logger: log,
    env: envVars
  };
}
