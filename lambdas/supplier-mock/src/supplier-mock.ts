/* eslint-disable sonarjs/no-commented-code */
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { Deps } from "./deps";
import { RequestHeaders } from "../../../tests/constants/request-headers";

export default function createHandler(deps: Deps) {
  return async () => {
    deps.logger.info("Hello from the supplier mock lambda!");
    // const envName = deps.env.ENVIRONMENT;
    const envName = "pr535";
    deps.logger.info("VLASIS - second log");
    deps.logger.info(`Environment: ${envName}`);
    deps.logger.info({
      msg: `Environment: ${envName}`,
    });
    // const input: ListFunctionsRequest = {
    //   MaxItems: 1000,
    // };
    // const command = new ListFunctionsCommand(input);
    // deps.logger.info("VLASIS - Invoking ListFunctionsCommand");
    // const response = await deps.lambdaClient.send(command);
    // const functions: FunctionConfiguration[] = response.Functions ?? [];
    // console.log(
    //   "list of functions in my environment:",
    //   functions
    //     .map((fn) => fn.FunctionName)
    //     .filter((fnName) => fnName?.includes(envName))
    //     .join("\n"),
    // );

    // const getLettersLambdaResponse = await deps.lambdaClient.send(
    //   new InvokeCommand({
    //     FunctionName: `nhs-${envName}-supapi-getletters`,
    //     InvocationType: "RequestResponse",
    //     Payload: Buffer.from(JSON.stringify({ test: "VLASIS data" })),
    //   }),
    // );

    deps.logger.info("Invoking get_letters lambda directly");

    if (!deps.env.GET_LETTERS_FUNCTION_NAME) {
      throw new Error("GET_LETTERS_FUNCTION_NAME is not configured");
    }

    const headers: RequestHeaders = {
      "NHSD-Supplier-ID": "TestSupplier1",
      "NHSD-Correlation-ID": "12345",
      "X-Request-ID": "requestId1",
    };

    const invokeResponse = await deps.lambdaClient.send(
      new InvokeCommand({
        FunctionName: deps.env.GET_LETTERS_FUNCTION_NAME,
        InvocationType: "RequestResponse",
        Payload: Buffer.from(
          JSON.stringify({
            headers: {
              "nhsd-supplier-id": headers["NHSD-Supplier-ID"],
              "nhsd-correlation-id": headers["NHSD-Correlation-ID"],
              "x-request-id": headers["X-Request-ID"],
            },
            queryStringParameters: null,
            requestContext: {},
          }),
        ),
      }),
    );

    const responsePayload = invokeResponse.Payload
      ? JSON.parse(Buffer.from(invokeResponse.Payload).toString("utf8"))
      : undefined;

    deps.logger.info(
      {
        statusCode: responsePayload?.statusCode,
        functionError: invokeResponse.FunctionError,
      },
      "Received response from get_letters lambda",
    );
    deps.logger.info({
      body: responsePayload?.body,
    });
  };
}
