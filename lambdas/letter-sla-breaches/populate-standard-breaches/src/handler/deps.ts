import { AthenaClient } from "@aws-sdk/client-athena";
import { S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "@internal/helpers";
import { Logger } from "pino";
import { type EnvVars, parseEnvVars } from "./env";
import S3Cache from "./s3-cache";
import { $BankHolidays, BankHolidays } from "../types";

export type Deps = {
  athenaClient: AthenaClient;
  s3Cache: S3Cache<BankHolidays>;
  logger: Logger;
  env: EnvVars;
};

function createS3Cache(
  s3Client: S3Client,
  env: EnvVars,
  logger: Logger,
): S3Cache<BankHolidays> {
  return new S3Cache(
    s3Client,
    env.BANK_HOLIDAY_CACHE_BUCKET_NAME,
    logger,
    "bank_holiday_cache/cache",
    $BankHolidays,
  );
}

export default function createDependenciesContainer(): Deps {
  const env = parseEnvVars(process.env);
  const athenaClient = new AthenaClient();
  const logger = createLogger({
    logLevel: env.PINO_LOG_LEVEL,
    logReference: env.LOG_REFERENCE,
  });
  const s3Cache = createS3Cache(new S3Client(), env, logger);

  return {
    athenaClient,
    s3Cache,
    logger,
    env,
  };
}
