import { InvokeCommand } from "@aws-sdk/client-lambda";
import { Deps } from "./deps";
import { SupplierMockConfig } from "./types";
import LogRefs from "./log-references";

export default function createHandler(deps: Deps) {
  return async () => {
    deps.logger.info(
      { logRef: LogRefs.STARTING_SUPPLIER_MOCK.code },
      LogRefs.STARTING_SUPPLIER_MOCK.description,
    );
    checkDepsAreSet(deps);
    const config = await parseSupplierMockConfig(deps);
    const headers = {
      "nhsd-supplier-id": config.supplierId,
      "nhsd-correlation-id": "12345",
      "x-request-id": "requestId1",
    };
    const letters = await callGetLetters(deps, headers, config.limit);
    deps.logger.info(
      {
        logRef: LogRefs.FORWARDING_LETTERS_TO_PATCH.code,
        lettersCount: letters.length,
      },
      LogRefs.FORWARDING_LETTERS_TO_PATCH.description,
    );
    await callPatchLetter(
      deps,
      headers,
      letters,
      config.specificationIdMapping,
    );
    deps.logger.info(
      { logRef: LogRefs.FINISHED_SUPPLIER_MOCK.code },
      LogRefs.FINISHED_SUPPLIER_MOCK.description,
    );
  };
}

async function callPatchLetter(
  deps: Deps,
  headers: Record<string, string>,
  letters: any[],
  specificationIdMapping: Map<string, string>,
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
                    status: getUpdateStatus(
                      specificationIdMapping,
                      letter.attributes?.specificationId,
                    ),
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
          logRef: LogRefs.FAILED_TO_INVOKE_PATCH_LETTER.code,
          error,
          functionName: deps.env.PATCH_LETTER_FUNCTION_NAME,
          letterId: letter.id,
        },
        LogRefs.FAILED_TO_INVOKE_PATCH_LETTER.description,
      );
      throw error;
    }

    if (patchInvokeResponse.FunctionError) {
      const patchPayload = patchInvokeResponse.Payload
        ? JSON.parse(Buffer.from(patchInvokeResponse.Payload).toString("utf8"))
        : undefined;

      deps.logger.error(
        {
          logRef: LogRefs.PATCH_LETTER_FUNCTION_ERROR.code,
          functionName: deps.env.PATCH_LETTER_FUNCTION_NAME,
          letterId: letter.id,
          functionError: patchInvokeResponse.FunctionError,
          payload: patchPayload,
        },
        LogRefs.PATCH_LETTER_FUNCTION_ERROR.description,
      );

      throw new Error(
        `patch_letter lambda invocation failed for letter ${letter.id}`,
      );
    }
  }
}

function getUpdateStatus(
  specificationIdMapping: Map<string, string>,
  specificationId: unknown,
): string {
  if (typeof specificationId !== "string") {
    return "ACCEPTED";
  }

  const mappedStatus = specificationIdMapping.get(specificationId);
  return mappedStatus || "ACCEPTED";
}

async function callGetLetters(
  deps: Deps,
  headers: Record<string, string>,
  limitValue: string,
): Promise<any[]> {
  deps.logger.info({
    logRef: LogRefs.CALLING_GET_LETTERS.code,
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
            queryStringParameters: { limit: limitValue },
            requestContext: {},
          }),
        ),
      }),
    );
  } catch (error) {
    deps.logger.error(
      {
        logRef: LogRefs.FAILED_TO_INVOKE_GET_LETTERS.code,
        error,
        functionName: deps.env.GET_LETTERS_FUNCTION_NAME,
        supplierId: headers["nhsd-supplier-id"],
        limitValue,
      },
      LogRefs.FAILED_TO_INVOKE_GET_LETTERS.description,
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

async function parseSupplierMockConfig(
  deps: Deps,
): Promise<SupplierMockConfig> {
  try {
    const configParameter = await deps.parameterStoreConfig;
    const configValue = configParameter.Parameter?.Value;
    const parsedConfig = configValue ? JSON.parse(configValue) : {};
    const limit = getLimit(parsedConfig.limit);
    const supplierId = getSupplierId(parsedConfig.supplier_id);

    deps.logger.info(
      {
        logRef: LogRefs.PARSED_SUPPLIER_MOCK_CONFIG.code,
        limit,
        supplierId,
      },
      LogRefs.PARSED_SUPPLIER_MOCK_CONFIG.description,
    );

    return {
      limit,
      supplierId,
      specificationIdMapping: getSpecificationIdMapping(
        parsedConfig.specification_id_mapping,
      ),
    };
  } catch (error) {
    deps.logger.error(
      {
        logRef: LogRefs.FAILED_TO_READ_CONFIG.code,
        error,
        parameterName: deps.env.SUPPLIER_MOCK_CONFIG_PARAM_NAME,
      },
      LogRefs.FAILED_TO_READ_CONFIG.description,
    );
    throw error;
  }
}

function getLimit(limitValue: unknown): string {
  if (typeof limitValue !== "string") {
    return "100";
  }

  return Number.parseInt(limitValue, 10) > 1 ? limitValue : "100";
}

function getSupplierId(supplierIdValue: unknown): string {
  return typeof supplierIdValue === "string" && supplierIdValue !== ""
    ? supplierIdValue
    : "TestSupplier1";
}

function getSpecificationIdMapping(mappingValue: unknown): Map<string, string> {
  if (!mappingValue || typeof mappingValue !== "object") {
    return new Map<string, string>();
  }

  const mapping = new Map<string, string>();
  for (const [key, value] of Object.entries(mappingValue)) {
    if (typeof key === "string" && typeof value === "string") {
      mapping.set(key, value);
    }
  }

  return mapping;
}

function checkDepsAreSet(deps: Deps) {
  if (!deps.env.GET_LETTERS_FUNCTION_NAME) {
    throw new Error("GET_LETTERS_FUNCTION_NAME is not configured");
  }
  if (!deps.env.PATCH_LETTER_FUNCTION_NAME) {
    throw new Error("PATCH_LETTER_FUNCTION_NAME is not configured");
  }
  if (!deps.env.SUPPLIER_MOCK_CONFIG_PARAM_NAME) {
    throw new Error("SUPPLIER_MOCK_CONFIG_PARAM_NAME is not configured");
  }
}
