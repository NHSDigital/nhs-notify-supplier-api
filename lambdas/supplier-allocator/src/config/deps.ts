import { SQSClient } from "@aws-sdk/client-sqs";
import pino from "pino";
import { EnvVars, envVars } from "./env";

export type Deps = {
  logger: pino.Logger;
  env: EnvVars;
  sqsClient: SQSClient;
};

export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    logger: log,
    env: envVars,
    sqsClient: new SQSClient({}),
  };
}
