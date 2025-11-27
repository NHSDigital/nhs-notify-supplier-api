import pino from 'pino';
import { envVars, EnvVars } from "./env";
import { SNSClient } from "@aws-sdk/client-sns";

export type Deps = {
  snsClient: SNSClient;
  logger: pino.Logger;
  env: EnvVars;
};

function createSNSClient(): SNSClient {
  return new SNSClient({});
}


export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    snsClient: createSNSClient(),
    logger: log,
    env: envVars
  };
}
