import { Logger } from "pino";
import { createLogger } from "@internal/helpers/src";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { EnvVars, envVars } from "./env";

export type Deps = {
  logger: Logger;
  env: EnvVars;
  lambdaClient: LambdaClient;
};

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });
  const lambdaClient = new LambdaClient();

  return {
    logger: log,
    env: envVars,
    lambdaClient,
  };
}
