import { Logger } from "pino";
import { createLogger } from "@internal/helpers/src";
import { EnvVars, envVars } from "./env";

export type Deps = {
  logger: Logger;
  env: EnvVars;
};

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

  return {
    logger: log,
    env: envVars,
  };
}
