import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import pino from 'pino';
import { LetterRepository } from '../../../../internal/datastore';
import { lambdaEnv, LambdaEnv } from "../config/env";

let singletonDeps: Deps | null = null;

export type Deps = {
  s3Client: S3Client;
  letterRepo: LetterRepository;
  logger: pino.Logger,
  env: LambdaEnv
};

function createLetterRepository(log: pino.Logger, lambdaEnv: LambdaEnv): LetterRepository {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const config = {
    lettersTableName: lambdaEnv.LETTERS_TABLE_NAME,
    ttlHours: Number.parseInt(lambdaEnv.LETTER_TTL_HOURS)
  };

  return new LetterRepository(docClient, log, config);
}

export function getDeps(): Deps {

  if (singletonDeps) return singletonDeps;

  const log = pino();

  singletonDeps = {
    s3Client: new S3Client(),
    letterRepo: createLetterRepository(log, lambdaEnv),
    logger: log,
    env: lambdaEnv
  };

  return singletonDeps;
}
