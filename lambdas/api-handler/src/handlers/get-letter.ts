import { APIGatewayProxyHandler } from "aws-lambda";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from '../utils/commonIds';
import { ValidationError } from "../errors";
import { ApiErrorDetail } from "../contracts/errors";
import { getLetterById } from "../services/letter-operations";
import { mapErrorToResponse } from "../mappers/error-mapper";
import { mapToGetLetterResponse } from "../mappers/letter-mapper";
import { Deps } from "../config/deps";


export function createGetLetterHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonIds = extractCommonIds(event.headers, event.requestContext, deps);

    if (!commonIds.ok) {
      return mapErrorToResponse(commonIds.error, commonIds.correlationId, deps.logger);
    }

    try {
      const letterId = assertNotEmpty(event.pathParameters?.id, new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));

      const letter = await getLetterById(commonIds.value.supplierId, letterId, deps.letterRepo);

      const response = mapToGetLetterResponse(letter);

      deps.logger.info({
        description: 'Letter successfully fetched by id',
        supplierId: commonIds.value.supplierId,
        letterId
      });

      return {
        statusCode: 200,
        body: JSON.stringify(response, null, 2),
      };
    } catch (error)
    {
      return mapErrorToResponse(error, commonIds.value.correlationId, deps.logger);
    }
  }
}
