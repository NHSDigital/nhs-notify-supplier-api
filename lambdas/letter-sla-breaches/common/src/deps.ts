import { AthenaClient } from "@aws-sdk/client-athena";
import { createLogger } from "@internal/helpers";
import { Logger } from "pino";

export type Deps = {
  athenaClient: AthenaClient;
  logger: Logger;
  env: {
    ATHENA_WORKGROUP: string;
    ATHENA_DATABASE: string;
    EVENT_CACHE_TABLE_NAME: string;
  };
};

export default function createDependenciesContainer(): Deps {
  return {
    athenaClient: new AthenaClient(),
    logger: createLogger({ logLevel: process.env.PINO_LOG_LEVEL }),
    env: {
      ATHENA_WORKGROUP: process.env.ATHENA_WORKGROUP!,
      ATHENA_DATABASE: process.env.ATHENA_DATABASE!,
      EVENT_CACHE_TABLE_NAME: process.env.EVENT_CACHE_TABLE_NAME!,
    },
  };
}
