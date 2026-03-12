import { Logger } from "pino";
import { SNSClient } from "@aws-sdk/client-sns";
import { createLogger } from "@internal/helpers/src";
import { EnvVars, envVars } from "./env";

export type Deps = {
  snsClient: SNSClient;
  logger: Logger;
  env: EnvVars;
};

function createSNSClient(): SNSClient {
  return new SNSClient({});
}

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

  return {
    snsClient: createSNSClient(),
    logger: log,
    env: envVars,
  };
}
