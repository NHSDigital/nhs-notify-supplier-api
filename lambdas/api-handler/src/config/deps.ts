import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SNSClient } from "@aws-sdk/client-sns";
import { Logger } from "pino";
import {
  DBHealthcheck,
  LetterQueueRepository,
  LetterRepository,
  MIRepository,
} from "@internal/datastore";
import { createLogger } from "@internal/helpers";
import { EnvVars, envVars } from "./env";

export type Deps = {
  s3Client: S3Client;
  sqsClient: SQSClient;
  snsClient: SNSClient;
  letterRepo: LetterRepository;
  letterQueueRepo: LetterQueueRepository;
  miRepo: MIRepository;
  dbHealthcheck: DBHealthcheck;
  logger: Logger;
  env: EnvVars;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createLetterRepository(
  log: Logger,
  environment: EnvVars,
): LetterRepository {
  const config = {
    lettersTableName: environment.LETTERS_TABLE_NAME,
    lettersTtlHours: environment.LETTER_TTL_HOURS,
  };

  return new LetterRepository(createDocumentClient(), log, config);
}

function createLetterQueueRepository(
  log: Logger,
  environment: EnvVars,
): LetterQueueRepository {
  const config = {
    letterQueueTableName: environment.LETTER_QUEUE_TABLE_NAME,
    letterQueueTtlHours: environment.LETTER_QUEUE_TTL_HOURS,
  };

  return new LetterQueueRepository(createDocumentClient(), log, config);
}

function createDBHealthcheck(environment: EnvVars): DBHealthcheck {
  const config = {
    lettersTableName: environment.LETTERS_TABLE_NAME,
    lettersTtlHours: environment.LETTER_TTL_HOURS,
  };

  return new DBHealthcheck(createDocumentClient(), config);
}

function createMIRepository(log: Logger, environment: EnvVars): MIRepository {
  const config = {
    miTableName: environment.MI_TABLE_NAME,
    miTtlHours: environment.MI_TTL_HOURS,
  };

  return new MIRepository(createDocumentClient(), log, config);
}

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

  return {
    s3Client: new S3Client(),
    sqsClient: new SQSClient(),
    snsClient: new SNSClient(),
    letterRepo: createLetterRepository(log, envVars),
    letterQueueRepo: createLetterQueueRepository(log, envVars),
    miRepo: createMIRepository(log, envVars),
    dbHealthcheck: createDBHealthcheck(envVars),
    logger: log,
    env: envVars,
  };
}
