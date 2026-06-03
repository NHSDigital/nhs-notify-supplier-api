import { Logger } from "pino";
import { createLogger } from "@internal/helpers/src";
import { LambdaClient } from "@aws-sdk/client-lambda";
import {
  GetParameterCommand,
  GetParameterCommandOutput,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { EnvVars, envVars } from "./env";

export type Deps = {
  logger: Logger;
  env: EnvVars;
  lambdaClient: LambdaClient;
  parameterStoreConfig: Promise<GetParameterCommandOutput>;
};

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });
  const lambdaClient = new LambdaClient();
  const parameterStoreConfig = getParameterStoreConfig();

  // also do the lookup for the parameters in the parameter store.

  return {
    logger: log,
    env: envVars,
    lambdaClient,
    parameterStoreConfig,
  };
}

function getParameterStoreConfig(): Promise<GetParameterCommandOutput> {
  const ssmClient = new SSMClient();
  const configParameter = ssmClient.send(
    new GetParameterCommand({
      Name: envVars.SUPPLIER_MOCK_CONFIG_PARAM_NAME,
      WithDecryption: true,
    }),
  );
  return configParameter;
}
