import { AthenaClient } from "@aws-sdk/client-athena";
import { createLogger } from "@internal/helpers";
import { Logger } from "pino";

export type AthenaDeps = {
  athenaClient: AthenaClient;
  logger: Logger;
  env: {
    ATHENA_WORKGROUP: string;
    ATHENA_DATABASE: string;
  };
};

export type Deps = {
  athenaClient: AthenaClient;
  logger: Logger;
  env: {
    ATHENA_WORKGROUP: string;
    ATHENA_DATABASE: string;
    EVENT_CACHE_TABLE_NAME: string;
    PACK_SPECIFICATION_TABLE_NAME: string;
    SUBSCRIPTION_TABLE_NAME: string;
    PUBLICATION_TABLE_NAME: string;
  };
};

export default function createDependenciesContainer(
  logReference?: string,
): Deps {
  return {
    athenaClient: new AthenaClient(),
    logger: createLogger({
      logLevel: process.env.PINO_LOG_LEVEL,
      logReference,
    }),
    env: {
      ATHENA_WORKGROUP: process.env.ATHENA_WORKGROUP!,
      ATHENA_DATABASE: process.env.ATHENA_DATABASE!,
      EVENT_CACHE_TABLE_NAME: process.env.EVENT_CACHE_TABLE_NAME!,
      PACK_SPECIFICATION_TABLE_NAME: process.env.PACK_SPECIFICATION_TABLE_NAME!,
      SUBSCRIPTION_TABLE_NAME: process.env.SUBSCRIPTION_TABLE_NAME!,
      PUBLICATION_TABLE_NAME: process.env.PUBLICATION_TABLE_NAME!,
    },
  };
}
