import { Logger } from "pino";
import { createLogger } from "@internal/helpers";
import { envVars } from "./env";

export type Deps = {
  logger: Logger;
};

export function createDependenciesContainer(): Deps {
  return {
    logger: createLogger({
      logLevel: envVars.PINO_LOG_LEVEL,
      logReference: envVars.LOG_REFERENCE,
    }),
  };
}
