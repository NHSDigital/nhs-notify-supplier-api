import { APIGatewayProxyHandler } from "aws-lambda";
import { assertNotEmpty, validateCommonHeaders } from "../utils/validation";
import { ApiErrorDetail } from '../contracts/errors';
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";
import { getLetterDataUrl } from "../services/letter-operations";
import type { Deps } from "../config/deps";


export function createGetLetterDataHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonHeadersResult = validateCommonHeaders(event.headers, deps);

    if (!commonHeadersResult.ok) {
      return mapErrorToResponse(commonHeadersResult.error, commonHeadersResult.correlationId, deps.logger);
    }

    try {
      const letterId = assertNotEmpty( event.pathParameters?.id,
        new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));

      return {
        statusCode: 303,
        headers: {
          'Location': await getLetterDataUrl(commonHeadersResult.value.supplierId, letterId, deps)
        },
        body: ''
      };
    }
    catch (error) {
      return mapErrorToResponse(error, commonHeadersResult.value.correlationId, deps.logger);
    }
  }
};
