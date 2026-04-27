import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/dynamodb";
import { Logger } from "pino";
import { LetterRepository } from "@internal/datastore";
import { createLogger } from "@internal/helpers";
import { EnvVars, envVars } from "./env";

export type Deps = {
  letterRepo: LetterRepository;
  idempotencyLayer: DynamoDBPersistenceLayer;
  logger: Logger;
  env: EnvVars;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createLetterRepository(log: Logger): LetterRepository {
  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    lettersTtlHours: envVars.LETTER_TTL_HOURS,
  };

  return new LetterRepository(createDocumentClient(), log, config);
}

function createIdempotencyLayer(): DynamoDBPersistenceLayer {
  return new DynamoDBPersistenceLayer({
    tableName: envVars.IDEMPOTENCY_TABLE_NAME,
  });
}

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

  return {
    letterRepo: createLetterRepository(log),
    idempotencyLayer: createIdempotencyLayer(),
    logger: log,
    env: envVars,
  };
}
