import OpenAPIResponseValidator from "openapi-response-validator";
import path from 'path';

const paths = path.resolve(__dirname, '../../build/notify-supplier.json');
const openapiDoc = require(paths);

type ValidationResult = ReturnType<OpenAPIResponseValidator["validateResponse"]>;
/**
 * Validate a response against the OpenAPI spec for a given endpoint and method.
 *
 * @param method - HTTP method in lowercase ('get', 'post', etc.)
 * @param path - API path (must match OpenAPI path exactly, e.g., '/items')
 * @param status - HTTP status code returned by the API
 * @param body - Response body to validate
 * @returns ValidationResult or undefined if valid
 */
export function validateApiResponse(
  method: string,
  path: string,
  status: number,
  body: any
): ValidationResult {
  const pathItem = (openapiDoc.paths as Record<string, any>)[path];

  if (!pathItem) throw new Error(`Path ${path} not found in OpenAPI spec`);

  const operation = pathItem[method];
  if (!operation) throw new Error(`Method ${method.toUpperCase()} not defined for ${path}`);

  // Find the response schema for the actual status code
  const responseSchema = operation.responses[status] || operation.responses["default"];
  if (!responseSchema) {
    throw new Error(`No schema defined for status ${status} at ${method.toUpperCase()} ${path}`);
  }

  const validator = new OpenAPIResponseValidator({
    responses: { [status]: responseSchema },
    components: openapiDoc.components,
  });

  return validator.validateResponse(status, body);
}
