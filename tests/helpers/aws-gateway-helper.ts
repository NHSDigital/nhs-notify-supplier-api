import {
  APIGatewayClient,
  RestApi,
  paginateGetRestApis,
} from "@aws-sdk/client-api-gateway";
import { API_NAME, AWS_REGION } from "../constants/api-constants";

export default async function getRestApiGatewayBaseUrl(): Promise<string> {
  const region = AWS_REGION;
  const client = new APIGatewayClient({ region });

  const api = await getApi(API_NAME, client);

  return `https://${api.id}.execute-api.${region}.amazonaws.com/main`;
}

async function getApi(
  apiName: string,
  client: APIGatewayClient,
): Promise<RestApi> {
  for await (const page of paginateGetRestApis({ client }, {})) {
    const filtered = page.items?.filter((api) => api.name === apiName);
    if (filtered?.length === 1) {
      return filtered[0];
    }
  }
  throw new Error(`API with name "${apiName}" not found.`);
}
