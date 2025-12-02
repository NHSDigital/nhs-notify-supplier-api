import pino from "pino";
import { KinesisClient } from "@aws-sdk/client-kinesis";
import { EnvVars, envVars } from "./env";

export type Deps = {
  kinesisClient: KinesisClient;
  logger: pino.Logger;
  env: EnvVars;
};

export function createDependenciesContainer(): Deps {
  return {
    kinesisClient: new KinesisClient({}),
    logger: pino(),
    env: envVars,
  };
}
