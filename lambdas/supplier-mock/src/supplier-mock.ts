/* eslint-disable sonarjs/no-commented-code */
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

    deps.logger.info(
      "VLASIS - about to make a request to the get letters endpoint of the supplier API",
    );
    deps.logger.info(`Base URL from deps: ${deps.baseUrl}`);
    const headers: RequestHeaders = {
      "NHSD-Supplier-ID": "TestSupplier1",
      "NHSD-Correlation-ID": "12345",
      "X-Request-ID": "requestId1",
    };

    const getLettersResponse = await fetch(`${deps.baseUrl}/letters`, {
      method: "GET",
      headers,
    });
    deps.logger.info(
      `Response from get letters lambda: ${getLettersResponse.status} - ${getLettersResponse.statusText}`,
    );
  };
}
