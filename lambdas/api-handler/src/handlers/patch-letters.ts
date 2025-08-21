import { APIGatewayProxyHandler } from 'aws-lambda';
import { createLetterRepository } from '../infrastructure/letter-repo-factory';
import { patchLetterStatus } from '../services/letter-operations';
import { LetterApiDocument } from '../contracts/letter-api';
import * as errors from '../contracts/errors';
import { ValidationError } from '../errors';
import { mapErrorToResponse } from '../mappers/error-mapper';

const letterRepo = createLetterRepository();
export const patchLetters: APIGatewayProxyHandler = async (event) => {

  try {
    const supplierId = assertNotEmpty(event.headers['app-supplier-id'], errors.ApiErrorDetail.InvalidRequestMissingSupplierId);
    const letterId = assertNotEmpty( event.pathParameters?.id, errors.ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter);
    const body = assertNotEmpty(event.body, errors.ApiErrorDetail.InvalidRequestMissingBody);

    const patchLetterRequest: LetterApiDocument = JSON.parse(body);

    const result = await patchLetterStatus(patchLetterRequest.data, letterId!, supplierId!, letterRepo);

    return {
      statusCode: 200,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    return mapErrorToResponse(error);
  }
};

function assertNotEmpty(value: string | null | undefined, detail: errors.ApiErrorDetail): string {
  if (!value || value.trim() === '') {
    throw new ValidationError(detail);
  }
  return value;
}
