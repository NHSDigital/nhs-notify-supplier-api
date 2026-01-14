import {
  GetFunctionConfigurationCommand,
  GetFunctionConfigurationCommandOutput,
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import { AWS_REGION } from "tests/constants/api-constants";

const lambdaClient = new LambdaClient({ region: AWS_REGION });

export async function getLambdaEnv(
  functionArn: string,
): Promise<Record<string, string>> {
  const response: GetFunctionConfigurationCommandOutput =
    await lambdaClient.send(
      new GetFunctionConfigurationCommand({
        FunctionName: functionArn,
      }),
    );
  return response.Environment?.Variables ?? {};
}

export async function updateLambdaEnv(
  functionArn: string,
  variables: Record<string, string>,
) {
  await lambdaClient.send(
    new UpdateFunctionConfigurationCommand({
      FunctionName: functionArn,
      Environment: { Variables: variables },
    }),
  );
}
