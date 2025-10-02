import { APIGatewayProxyHandler } from 'aws-lambda';
import { createLetterRepository } from '../infrastructure/letter-repo-factory';
import { patchLetterStatus } from '../services/letter-operations';
import { PatchLetterRequest, PatchLetterRequestSchema } from '../contracts/letters';
import { ApiErrorDetail } from '../contracts/errors';
import { ValidationError } from '../errors';
import { mapErrorToResponse } from '../mappers/error-mapper';
import { lambdaConfig } from "../config/lambda-config";
import { assertNotEmpty } from '../utils/validation';
import { mapToLetterDto } from '../mappers/letter-mapper';

const letterRepo = createLetterRepository();
export const patchLetters: APIGatewayProxyHandler = async (event) => {

  let correlationId;

  try {
    assertNotEmpty(event.headers, new Error('The request headers are empty'));
    correlationId = assertNotEmpty(event.headers[lambdaConfig.APIM_CORRELATION_HEADER], new Error("The request headers don't contain the APIM correlation id"));
    const supplierId = assertNotEmpty(event.headers[lambdaConfig.SUPPLIER_ID_HEADER], new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));
    const letterId = assertNotEmpty( event.pathParameters?.id, new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));
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

    const result = await patchLetterStatus(mapToLetterDto(patchLetterRequest, supplierId!), letterId!, letterRepo);

    return {
      statusCode: 200,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    return mapErrorToResponse(error, correlationId);
  }
};
