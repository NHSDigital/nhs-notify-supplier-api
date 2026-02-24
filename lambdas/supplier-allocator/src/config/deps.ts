import { SQSClient } from "@aws-sdk/client-sqs";
import { Logger } from "pino";
import { createLogger } from "@internal/helpers";
import { EnvVars, envVars } from "./env";

export type Deps = {
  logger: Logger;
  env: EnvVars;
  sqsClient: SQSClient;
};

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

  return {
    logger: log,
    env: envVars,
    sqsClient: new SQSClient({}),
  };
}
