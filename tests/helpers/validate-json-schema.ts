import OpenAPIResponseValidator from "openapi-response-validator";
import path from "node:path";

const paths = path.resolve(__dirname, "../../build/notify-supplier.json");

type ValidationResult = ReturnType<
  OpenAPIResponseValidator["validateResponse"]
>;
/**
 * Validate a response against the OpenAPI spec for a given endpoint and method.
 *
 * @param method - HTTP method in lowercase ('get', 'post', etc.)
 * @param path - API path (must match OpenAPI path exactly, e.g., '/items')
 * @param status - HTTP status code returned by the API
 * @param body - Response body to validate
 * @returns ValidationResult or undefined if valid
 */
export default async function validateApiResponse(
  method: string,
  pathVar: string,
  status: number,
  body: any
): Promise<ValidationResult> {
  const openapiDoc = await import(paths);

  const pathItem = (openapiDoc.default.paths as Record<string, any>)[pathVar];

  if (!pathItem) throw new Error(`Path ${pathVar} not found in OpenAPI spec`);

  const operation = pathItem[method];
  if (!operation)
    throw new Error(`Method ${method.toUpperCase()} not defined for ${path}`);

  // Find the response schema for the actual status code
  const responseSchema =
    operation.responses[status] || operation.responses.default;
  if (!responseSchema) {
    throw new Error(
      `No schema defined for status ${status} at ${method.toUpperCase()} ${pathVar}`
    );
  }

  const validator = new OpenAPIResponseValidator({
    responses: { [status]: responseSchema },
    components: openapiDoc.default.components,
  });

  return validator.validateResponse(status, body);
}
