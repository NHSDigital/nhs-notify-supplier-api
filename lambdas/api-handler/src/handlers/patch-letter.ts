import { APIGatewayProxyHandler } from 'aws-lambda';
import { patchLetterStatus } from '../services/letter-operations';
import { PatchLetterRequest, PatchLetterRequestSchema } from '../contracts/letters';
import { ApiErrorDetail } from '../contracts/errors';
import { ValidationError } from '../errors';
import { processError } from '../mappers/error-mapper';
import { assertNotEmpty } from '../utils/validation';
import { extractCommonIds } from '../utils/commonIds';
import { mapPatchLetterToDto } from '../mappers/letter-mapper';
import type { Deps } from "../config/deps";


export function createPatchLetterHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonIds = extractCommonIds(event.headers, event.requestContext, deps);

    if (!commonIds.ok) {
      return processError(commonIds.error, commonIds.correlationId, deps.logger);
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

      const updatedLetter = await patchLetterStatus(mapPatchLetterToDto(patchLetterRequest, commonIds.value.supplierId), letterId, deps.letterRepo);

      return {
        statusCode: 200,
        body: JSON.stringify(updatedLetter, null, 2)
      };

    } catch (error) {
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
};
