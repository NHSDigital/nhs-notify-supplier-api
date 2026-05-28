/* eslint-disable sonarjs/no-commented-code */
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { Deps } from "./deps";
import { RequestHeaders } from "../../../tests/constants/request-headers";

export default function createHandler(deps: Deps) {
  return async () => {
    deps.logger.info("Starting supplier mock lambda");
    deps.logger.info("Invoking get_letters lambda directly");

    if (!deps.env.GET_LETTERS_FUNCTION_NAME) {
      throw new Error("GET_LETTERS_FUNCTION_NAME is not configured");
    }

    // VLASIS: Replace TestSuplier1? Get it dynamically? Get for all suppliers?
    // Store the supplier as configuration in parameter store
    // also store the max limit as configuration in parameter store
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
            headers,
            queryStringParameters: { limit: "100" },
            requestContext: {},
          }),
        ),
      }),
    );

    // VLASIS: set as batches of 10 in patch letter
    // add batch size as configuration in parameter store
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
