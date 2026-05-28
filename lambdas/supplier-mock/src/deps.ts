import { Logger } from "pino";
import { createLogger } from "@internal/helpers/src";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { SSMClient } from "@aws-sdk/client-ssm";
import { EnvVars, envVars } from "./env";

export type Deps = {
  logger: Logger;
  env: EnvVars;
  lambdaClient: LambdaClient;
  ssmClient: SSMClient;
};

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });
  const lambdaClient = new LambdaClient();
  const ssmClient = new SSMClient();

  return {
    logger: log,
    env: envVars,
    lambdaClient,
    ssmClient,
  };
}
