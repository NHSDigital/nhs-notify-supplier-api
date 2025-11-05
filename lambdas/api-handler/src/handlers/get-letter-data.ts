import { APIGatewayProxyHandler } from "aws-lambda";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from '../utils/commonIds';
import { ApiErrorDetail } from '../contracts/errors';
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";
import { getLetterDataUrl } from "../services/letter-operations";
import type { Deps } from "../config/deps";


export function createGetLetterDataHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonIds = extractCommonIds(event.headers, event.requestContext, deps);

    if (!commonIds.ok) {
      return mapErrorToResponse(commonIds.error, commonIds.correlationId, deps.logger);
    }

    try {
      const letterId = assertNotEmpty( event.pathParameters?.id,
        new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));

      return {
        statusCode: 303,
        headers: {
          'Location': await getLetterDataUrl(commonIds.value.supplierId, letterId, deps)
        },
        body: ''
      };
    }
    catch (error) {
      return mapErrorToResponse(error, commonIds.value.correlationId, deps.logger);
    }
  }
};
