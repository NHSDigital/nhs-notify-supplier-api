import { AthenaClient } from "@aws-sdk/client-athena";
import { S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "@internal/helpers";
import { Logger } from "pino";
import { type EnvVars, parseEnvVars } from "./env";

export type Deps = {
  athenaClient: AthenaClient;
  s3Client: S3Client;
  logger: Logger;
  env: EnvVars;
};

export default function createDependenciesContainer(): Deps {
  const env = parseEnvVars(process.env);

  return {
    athenaClient: new AthenaClient(),
    s3Client: new S3Client(),
    logger: createLogger({ logLevel: env.PINO_LOG_LEVEL }),
    env,
  };
}
