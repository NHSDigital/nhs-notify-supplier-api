import { APIGatewayProxyHandler } from 'aws-lambda';
import { enqueueLetterUpdateRequests } from '../services/letter-operations';
import { LetterDto, PatchLetterRequest, PatchLetterRequestSchema } from '../contracts/letters';
import { ApiErrorDetail } from '../contracts/errors';
import { ValidationError } from '../errors';
import { processError } from '../mappers/error-mapper';
import { assertNotEmpty, validateCommonHeaders } from '../utils/validation';
import { mapPatchLetterToDto } from '../mappers/letter-mapper';
import type { Deps } from "../config/deps";


export function createPatchLetterHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonHeadersResult = validateCommonHeaders(event.headers, deps);

    if (!commonHeadersResult.ok) {
      return processError(commonHeadersResult.error, commonHeadersResult.correlationId, deps.logger);
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

      const letterToUpdate: LetterDto = mapPatchLetterToDto(patchLetterRequest, commonHeadersResult.value.supplierId);

      if (letterToUpdate.id !== letterId) {
        throw new ValidationError(ApiErrorDetail.InvalidRequestLetterIdsMismatch);
      }

      enqueueLetterUpdateRequests([letterToUpdate], commonHeadersResult.value.correlationId, deps);

      return {
        statusCode: 202,
        body: ''
      };

    } catch (error) {
      return processError(error, commonHeadersResult.value.correlationId, deps.logger);
    }
  };
};
