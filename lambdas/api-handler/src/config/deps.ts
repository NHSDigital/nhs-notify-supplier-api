import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import pino from 'pino';
import { LetterRepository, MIRepository, DBHealthcheck } from '@internal/datastore';
import { envVars, EnvVars } from "../config/env";

export type Deps = {
  s3Client: S3Client;
  letterRepo: LetterRepository;
  miRepo: MIRepository;
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
    lettersTtlHours: envVars.LETTER_TTL_HOURS
  };

  return new LetterRepository(documentClient, log, config);
}

function createDBHealthcheck(documentClient: DynamoDBDocumentClient, envVars: EnvVars): DBHealthcheck {
  const config = {
    lettersTableName: envVars.LETTERS_TABLE_NAME,
    lettersTtlHours: envVars.LETTER_TTL_HOURS
  };

  return new DBHealthcheck(documentClient, config);
}

function createMIRepository(documentClient: DynamoDBDocumentClient, log: pino.Logger, envVars: EnvVars): MIRepository {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const config = {
    miTableName: envVars.MI_TABLE_NAME,
    miTtlHours: envVars.MI_TTL_HOURS
  };

  return new MIRepository(docClient, log, config);
}

export function createDependenciesContainer(): Deps {

  const log = pino();
  const documentClient = createDocumentClient();

  return {
    s3Client: new S3Client(),
    letterRepo: createLetterRepository(documentClient, log, envVars),
    miRepo: createMIRepository(documentClient, log, envVars),
    dbHealthcheck: createDBHealthcheck(documentClient, envVars),
    logger: log,
    env: envVars
  };
}
