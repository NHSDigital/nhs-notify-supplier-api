import { Logger } from "pino";
import { createLogger } from "@internal/helpers/src";
import { LambdaClient } from "@aws-sdk/client-lambda";
import {
  APIGatewayClient,
  paginateGetRestApis,
} from "@aws-sdk/client-api-gateway";
import { EnvVars, envVars } from "./env";

export type Deps = {
  logger: Logger;
  env: EnvVars;
  lambdaClient: LambdaClient;
  apiClient: APIGatewayClient;
  baseUrl: string;
};

export async function createDependenciesContainer(): Promise<Deps> {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });
  const lambdaClient = new LambdaClient();
  const apiClient = new APIGatewayClient();
  const baseUrl = await getRestApiGatewayBaseUrl(envVars, apiClient);

  return {
    logger: log,
    env: envVars,
    lambdaClient,
    apiClient,
    baseUrl,
  };
}

async function getRestApiGatewayBaseUrl(
  environment: EnvVars,
  apiClient: APIGatewayClient,
): Promise<string> {
  console.log(
    "VLASIS - about to retrieve API Gateway base URL using API client",
  );
  // const apiName = `nhs-${environment.ENVIRONMENT}-supapi`;
  const apiName = `nhs-pr535-supapi`;
  const api = await getApi(apiName, apiClient);
  // return `https://${api.id}.execute-api.${environment.AWS_REGION}.amazonaws.com/main`;
  return `https://${api.id}.execute-api.eu-west-2.amazonaws.com/main`;
}

async function getApi(apiName: string, client: APIGatewayClient) {
  for await (const page of paginateGetRestApis({ client }, {})) {
    const filtered = page.items?.filter((api) => api.name === apiName);
    if (filtered?.length === 1) {
      return filtered[0];
    }
  }
  throw new Error(`API with name "${apiName}" not found.`);
}
