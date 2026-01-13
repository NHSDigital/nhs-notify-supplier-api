import {
  APIGatewayClient,
  GetRestApisCommand,
} from "@aws-sdk/client-api-gateway";
import { API_NAME, AWS_REGION } from "../constants/api-constants";

export default async function getRestApiGatewayBaseUrl(): Promise<string> {
  const region = AWS_REGION;
  const client = new APIGatewayClient({ region });

  const apis = await client.send(new GetRestApisCommand({}));
  const api = apis.items?.find((a) => a.name === API_NAME);

  if (!api?.id) throw new Error(`API with name "${API_NAME}" not found.`);

  return `https://${api.id}.execute-api.${region}.amazonaws.com/main`;
}
