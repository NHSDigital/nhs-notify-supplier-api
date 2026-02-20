import { Logger } from "pino";
import { createLogger } from "@internal/helpers/src";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { LetterQueueRepository } from "@internal/datastore";
import { EnvVars, envVars } from "./env";

export type Deps = {
  letterQueueRepository: LetterQueueRepository;
  logger: Logger;
  env: EnvVars;
};

function createDynamoDBDocumentClient(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(client);
}

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });
  const ddbClient = createDynamoDBDocumentClient();

  const letterQueueRepository = new LetterQueueRepository(ddbClient, log, {
    letterQueueTableName: envVars.LETTER_QUEUE_TABLE_NAME,
    letterQueueTtlHours: envVars.LETTER_QUEUE_TTL_HOURS,
  });

  return {
    letterQueueRepository,
    logger: log,
    env: envVars,
  };
}
