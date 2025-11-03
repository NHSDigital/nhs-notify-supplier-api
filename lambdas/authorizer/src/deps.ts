import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import pino from 'pino';
import { envVars, EnvVars } from "./env";

export type Deps = {
  cloudWatchClient: CloudWatchClient;
  logger: pino.Logger;
  env: EnvVars;
};

export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    cloudWatchClient: new CloudWatchClient({}),
    logger: log,
    env: envVars
  };
}
