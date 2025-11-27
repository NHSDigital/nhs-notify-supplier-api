import { APIGatewayProxyEvent, APIGatewayProxyEventHeaders } from "aws-lambda";
import { Deps } from "../config/deps";
import { lowerCaseKeys } from "./validation";

export function extractCommonIds(
  headers: APIGatewayProxyEventHeaders,
  context: APIGatewayProxyEvent["requestContext"],
  deps: Deps,
):
  | { ok: true; value: { correlationId: string; supplierId: string } }
  | { ok: false; error: Error; correlationId?: string } {
  if (!headers || Object.keys(headers).length === 0) {
    return { ok: false, error: new Error("The request headers are empty") };
  }

  const lowerCasedHeaders = lowerCaseKeys(headers);

  const correlationId = lowerCasedHeaders[deps.env.APIM_CORRELATION_HEADER];
  if (!correlationId) {
    return {
      ok: false,
      error: new Error(
        "The request headers don't contain the APIM correlation id",
      ),
    };
  }

  const requestId = lowerCasedHeaders["x-request-id"];
  if (!requestId) {
    return {
      ok: false,
      error: new Error("The request headers don't contain the x-request-id"),
      correlationId,
    };
  }

  // In normal API usage, we expect the authorizer to provide the supplier ID. When the lambda is invoked directly, for instance
  // in the AWS console, then fall back to using the header.

  const supplierId = context.authorizer
    ? context.authorizer.principalId
    : lowerCasedHeaders[deps.env.SUPPLIER_ID_HEADER];

  if (!supplierId) {
    return {
      ok: false,
      error: new Error("The supplier ID is missing from the request"),
      correlationId,
    };
  }

  return { ok: true, value: { correlationId, supplierId } };
}
