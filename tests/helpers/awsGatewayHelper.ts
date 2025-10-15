import { APIGatewayClient, GetRestApisCommand } from "@aws-sdk/client-api-gateway";

export async function getRestApiGatewayBaseUrl(
  apiName: string,
  region: string
): Promise<string> {
  const client = new APIGatewayClient({ region });


  const apis = await client.send(new GetRestApisCommand({}));
  const api = apis.items?.find((a) => a.name === apiName);

  if (!api?.id) throw new Error(`API with name "${apiName}" not found.`);

  const url = `https://${api.id}.execute-api.${region}.amazonaws.com/main`;
  return url;
}
