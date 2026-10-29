import { AthenaClient } from "@aws-sdk/client-athena";
import { S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "@internal/helpers";
import { Logger } from "pino";
import { type EnvVars, parseEnvVars } from "./env";
import S3Cache from "./s3-cache";

export type Deps = {
  athenaClient: AthenaClient;
  s3Cache: S3Cache;
  logger: Logger;
  env: EnvVars;
};

function createS3Cache(
  s3Client: S3Client,
  env: EnvVars,
  logger: Logger,
): S3Cache {
  return new S3Cache(s3Client, env.BANK_HOLIDAY_CACHE_BUCKET_NAME, logger);
}

export default function createDependenciesContainer(): Deps {
  const env = parseEnvVars(process.env);
  const athenaClient = new AthenaClient();
  const logger = createLogger({ logLevel: env.PINO_LOG_LEVEL });
  const s3Cache = createS3Cache(new S3Client(), env, logger);

  return {
    athenaClient,
    s3Cache,
    logger,
    env,
  };
}
