import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import pino from "pino";
import { LetterRepository } from "@internal/datastore";
import { EnvVars, envVars } from "./env";

export type Deps = {
  letterRepo: LetterRepository;
  logger: pino.Logger;
  env: EnvVars;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createLetterRepository(
  log: pino.Logger,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  envVars: EnvVars,
): LetterRepository {
  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    lettersTtlHours: envVars.LETTER_TTL_HOURS,
  };

  return new LetterRepository(createDocumentClient(), log, config);
}

export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    letterRepo: createLetterRepository(log, envVars),
    logger: log,
    env: envVars,
  };
}
