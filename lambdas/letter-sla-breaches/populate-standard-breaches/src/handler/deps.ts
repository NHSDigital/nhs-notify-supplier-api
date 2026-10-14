import { AthenaClient } from "@aws-sdk/client-athena";
import { createLogger } from "@internal/helpers";
import { Logger } from "pino";
import { type EnvVars, parseEnvVars } from "./env";

export type Deps = {
  athenaClient: AthenaClient;
  logger: Logger;
  env: EnvVars;
};

export default function createDependenciesContainer(): Deps {
  const env = parseEnvVars(process.env);

  return {
    athenaClient: new AthenaClient(),
    logger: createLogger({ logLevel: env.PINO_LOG_LEVEL }),
    env,
  };
}
