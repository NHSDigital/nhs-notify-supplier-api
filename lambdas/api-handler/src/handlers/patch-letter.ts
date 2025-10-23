import { APIGatewayProxyHandler } from 'aws-lambda';
import { patchLetterStatus } from '../services/letter-operations';
import { PatchLetterRequest, PatchLetterRequestSchema } from '../contracts/letters';
import { ApiErrorDetail } from '../contracts/errors';
import { ValidationError } from '../errors';
import { mapErrorToResponse } from '../mappers/error-mapper';
import { assertNotEmpty, validateCommonHeaders } from '../utils/validation';
import { mapToLetterDto } from '../mappers/letter-mapper';
import type { Deps } from "../config/deps";


export function createPatchLetterHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonHeadersResult = validateCommonHeaders(event.headers, deps);

    if (!commonHeadersResult.ok) {
      return mapErrorToResponse(commonHeadersResult.error, commonHeadersResult.correlationId, deps.logger);
    }

    try {
      const letterId = assertNotEmpty( event.pathParameters?.id,
        new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));
      const body = assertNotEmpty(event.body, new ValidationError(ApiErrorDetail.InvalidRequestMissingBody));

      let patchLetterRequest: PatchLetterRequest;

      try {
        patchLetterRequest = PatchLetterRequestSchema.parse(JSON.parse(body));
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(ApiErrorDetail.InvalidRequestBody, { cause: error});
        }
        else throw error;
      }

      const updatedLetter = await patchLetterStatus(mapToLetterDto(patchLetterRequest, commonHeadersResult.value.supplierId), letterId, deps.letterRepo);

      return {
        statusCode: 200,
        body: JSON.stringify(updatedLetter, null, 2)
      };

    } catch (error) {
      return mapErrorToResponse(error, commonHeadersResult.value.correlationId, deps.logger);
    }
  };
};
