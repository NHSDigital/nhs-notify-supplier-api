import { APIGatewayProxyHandler } from "aws-lambda";
import { assertNotEmpty, lowerCaseKeys } from "../utils/validation";
import { ApiErrorDetail } from '../contracts/errors';
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";
import { getLetterDataUrl } from "../services/letter-operations";
import type { Deps } from "../config/deps";


export function createGetLetterDataHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    let correlationId: string | undefined;

    try {
      assertNotEmpty(event.headers, new Error("The request headers are empty"));
      const lowerCasedHeaders = lowerCaseKeys(event.headers);
      correlationId = assertNotEmpty(lowerCasedHeaders[deps.env.APIM_CORRELATION_HEADER],
        new Error("The request headers don't contain the APIM correlation id"));
      const supplierId = assertNotEmpty(lowerCasedHeaders[deps.env.SUPPLIER_ID_HEADER],
        new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));
      const letterId = assertNotEmpty( event.pathParameters?.id,
        new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));

      return {
        statusCode: 303,
        headers: {
          'Location': await getLetterDataUrl(supplierId, letterId, deps)
        },
        body: ''
      };
    }
    catch (error) {
      return mapErrorToResponse(error, correlationId, deps.logger);
    }
  }
};
