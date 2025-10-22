import { APIGatewayProxyHandler } from "aws-lambda";
import { assertNotEmpty, validateCommonHeaders } from "../utils/validation";
import { ValidationError } from "../errors";
import { ApiErrorDetail } from "../contracts/errors";
import { getLetterById } from "../services/letter-operations";
import { mapErrorToResponse } from "../mappers/error-mapper";
import { mapToGetLetterResponse } from "../mappers/letter-mapper";
import { Deps } from "../config/deps";


export function createGetLetterHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonHeadersResult = validateCommonHeaders(event.headers, deps);

    if (!commonHeadersResult.ok) {
      return mapErrorToResponse(commonHeadersResult.error, commonHeadersResult.correlationId, deps.logger);
    }

    try {
      const letterId = assertNotEmpty(event.pathParameters?.id, new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));

      const letter = await getLetterById(commonHeadersResult.value.supplierId, letterId, deps.letterRepo);

      const response = mapToGetLetterResponse(letter);

      deps.logger.info({
        description: 'Letter successfully fetched by id',
        supplierId: commonHeadersResult.value.supplierId,
        letterId
      });

      return {
        statusCode: 200,
        body: JSON.stringify(response, null, 2),
      };
    } catch (error)
    {
      return mapErrorToResponse(error, commonHeadersResult.value.correlationId, deps.logger);
    }
  }
}
