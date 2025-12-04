import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import pino from "pino";
import {
  DBHealthcheck,
  LetterRepository,
  MIRepository,
} from "@internal/datastore";
import { EnvVars, envVars } from "./env";

export type Deps = {
  s3Client: S3Client;
  sqsClient: SQSClient;
  letterRepo: LetterRepository;
  miRepo: MIRepository;
  dbHealthcheck: DBHealthcheck;
  logger: pino.Logger;
  env: EnvVars;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createLetterRepository(
  log: pino.Logger,
  environment: EnvVars,
): LetterRepository {
  const config = {
    lettersTableName: environment.LETTERS_TABLE_NAME,
    lettersTtlHours: environment.LETTER_TTL_HOURS,
  };

  return new LetterRepository(createDocumentClient(), log, config);
}

function createDBHealthcheck(environment: EnvVars): DBHealthcheck {
  const config = {
    lettersTableName: environment.LETTERS_TABLE_NAME,
    lettersTtlHours: environment.LETTER_TTL_HOURS,
  };

  return new DBHealthcheck(createDocumentClient(), config);
}

function createMIRepository(
  log: pino.Logger,
  environment: EnvVars,
): MIRepository {
  const config = {
    miTableName: environment.MI_TABLE_NAME,
    miTtlHours: environment.MI_TTL_HOURS,
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
    dbHealthcheck: createDBHealthcheck(envVars),
    logger: log,
    env: envVars,
  };
}
