import { APIGatewayProxyHandler } from 'aws-lambda';
import { patchLetterStatus } from '../services/letter-operations';
import { PatchLetterRequest, PatchLetterRequestSchema } from '../contracts/letters';
import { ApiErrorDetail } from '../contracts/errors';
import { ValidationError } from '../errors';
import { mapErrorToResponse } from '../mappers/error-mapper';
import { assertNotEmpty, lowerCaseKeys } from '../utils/validation';
import { mapToLetterDto } from '../mappers/letter-mapper';
import type { Deps } from "../config/deps";


export function createPatchLetterHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    let correlationId: string | undefined;

    try {
      assertNotEmpty(event.headers, new Error('The request headers are empty'));
      const lowerCasedHeaders = lowerCaseKeys(event.headers);
      correlationId = assertNotEmpty(lowerCasedHeaders[deps.env.APIM_CORRELATION_HEADER],
        new Error("The request headers don't contain the APIM correlation id"));
      const supplierId = assertNotEmpty(lowerCasedHeaders[deps.env.SUPPLIER_ID_HEADER],
        new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));
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

      const result = await patchLetterStatus(mapToLetterDto(patchLetterRequest, supplierId), letterId, deps.letterRepo);

      return {
        statusCode: 200,
        body: JSON.stringify(result, null, 2)
      };

    } catch (error) {
      return mapErrorToResponse(error, correlationId, deps.logger);
    }
  };
};
