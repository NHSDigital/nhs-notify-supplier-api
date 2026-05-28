import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { Deps } from "./deps";

export default function createHandler(deps: Deps) {
  return async () => {
    deps.logger.info("Starting supplier mock lambda");
    checkDepsAreSet(deps);
    const limitValue = await parseLimitParameter(deps);
    const supplierId = await parseSupplierId(deps);
    const headers = {
      "nhsd-supplier-id": supplierId,
      "nhsd-correlation-id": "12345",
      "x-request-id": "requestId1",
    };
    const letters = await callGetLetters(deps, headers, limitValue);
    deps.logger.info(
      {
        lettersCount: letters.length,
      },
      "Forwarding letters to patch_letter lambda",
    );
    await callPatchLetter(deps, headers, letters);
    deps.logger.info("Finished supplier mock lambda");
  };
}

async function callPatchLetter(
  deps: Deps,
  headers: Record<string, string>,
  letters: any[],
): Promise<void> {
  for (const letter of letters) {
    let patchInvokeResponse;
    try {
      patchInvokeResponse = await deps.lambdaClient.send(
        new InvokeCommand({
          FunctionName: deps.env.PATCH_LETTER_FUNCTION_NAME,
          InvocationType: "RequestResponse",
          Payload: Buffer.from(
            JSON.stringify({
              headers,
              pathParameters: { id: letter.id },
              body: JSON.stringify({
                data: {
                  id: letter.id,
                  type: "Letter",
                  attributes: {
                    status: letter.attributes?.status,
                  },
                },
              }),
              requestContext: {},
            }),
          ),
        }),
      );
    } catch (error) {
      deps.logger.error(
        {
          error,
          functionName: deps.env.PATCH_LETTER_FUNCTION_NAME,
          letterId: letter.id,
        },
        "Failed to invoke patch_letter lambda",
      );
      throw error;
    }

    if (patchInvokeResponse.FunctionError) {
      const patchPayload = patchInvokeResponse.Payload
        ? JSON.parse(Buffer.from(patchInvokeResponse.Payload).toString("utf8"))
        : undefined;

      deps.logger.error(
        {
          functionName: deps.env.PATCH_LETTER_FUNCTION_NAME,
          letterId: letter.id,
          functionError: patchInvokeResponse.FunctionError,
          payload: patchPayload,
        },
        "patch_letter lambda returned a function error",
      );

      throw new Error(
        `patch_letter lambda invocation failed for letter ${letter.id}`,
      );
    }
  }
}

async function callGetLetters(
  deps: Deps,
  headers: Record<string, string>,
  limitValue: string,
): Promise<any[]> {
  deps.logger.info({
    message: `about to call getLetters with limit ${limitValue}`,
  });
  let invokeResponse;
  try {
    invokeResponse = await deps.lambdaClient.send(
      new InvokeCommand({
        FunctionName: deps.env.GET_LETTERS_FUNCTION_NAME,
        InvocationType: "RequestResponse",
        Payload: Buffer.from(
          JSON.stringify({
            headers,
            queryStringParameters: { limit: String(limitValue) },
            requestContext: {},
          }),
        ),
      }),
    );
  } catch (error) {
    deps.logger.error(
      {
        error,
        functionName: deps.env.GET_LETTERS_FUNCTION_NAME,
        supplierId: headers["nhsd-supplier-id"],
        limitValue,
      },
      "Failed to invoke get_letters lambda",
    );
    throw error;
  }
  const responsePayload = invokeResponse.Payload
    ? JSON.parse(Buffer.from(invokeResponse.Payload).toString("utf8"))
    : undefined;

  if (invokeResponse.FunctionError || responsePayload?.statusCode !== 200) {
    throw new Error("get_letters lambda invocation failed");
  }

  const getLettersBody = responsePayload?.body
    ? JSON.parse(responsePayload.body)
    : undefined;

  return Array.isArray(getLettersBody?.data) ? getLettersBody.data : [];
}

async function parseSupplierId(deps: Deps): Promise<string> {
  try {
    const supplierId = await deps.ssmClient.send(
      new GetParameterCommand({
        Name: deps.env.SUPPLIER_MOCK_SUPPLIER_ID,
      }),
    );
    const supplierIdValue = supplierId.Parameter?.Value;
    deps.logger.info(
      {
        supplierIdValue,
      },
      "Parsed supplier id from Parameter Store",
    );
    return supplierIdValue || "TestSupplier1";
  } catch (error) {
    deps.logger.error(
      {
        error,
        parameterName: deps.env.SUPPLIER_MOCK_SUPPLIER_ID,
      },
      "Failed to read supplier id from Parameter Store",
    );
    throw error;
  }
}

async function parseLimitParameter(deps: Deps): Promise<string> {
  try {
    const limitParameter = await deps.ssmClient.send(
      new GetParameterCommand({
        Name: deps.env.SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME,
      }),
    );
    const limitValue = limitParameter.Parameter?.Value;
    deps.logger.info(
      {
        limitValue,
      },
      "Parsed get letters limit from Parameter Store",
    );
    return limitValue && Number.parseInt(limitValue, 10) > 1
      ? limitValue
      : "100";
  } catch (error) {
    deps.logger.error(
      {
        error,
        parameterName: deps.env.SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME,
      },
      "Failed to read get letters limit from Parameter Store",
    );
    throw error;
  }
}

function checkDepsAreSet(deps: Deps) {
  if (!deps.env.GET_LETTERS_FUNCTION_NAME) {
    throw new Error("GET_LETTERS_FUNCTION_NAME is not configured");
  }
  if (!deps.env.PATCH_LETTER_FUNCTION_NAME) {
    throw new Error("PATCH_LETTER_FUNCTION_NAME is not configured");
  }
  if (!deps.env.SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME) {
    throw new Error(
      "SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME is not configured",
    );
  }
  if (!deps.env.SUPPLIER_MOCK_SUPPLIER_ID) {
    throw new Error("SUPPLIER_MOCK_SUPPLIER_ID is not configured");
  }
}
