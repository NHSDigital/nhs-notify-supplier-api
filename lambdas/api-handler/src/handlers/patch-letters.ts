import { APIGatewayProxyHandler } from 'aws-lambda';
import { createLetterRepository } from '../infrastructure/letter-repo-factory';
import { patchLetterStatus } from '../services/letter-operations';
import { LetterApiDocument, LetterApiDocumentSchema } from '../contracts/letter-api';
import * as errors from '../contracts/errors';
import { ValidationError } from '../errors';
import { mapErrorToResponse } from '../mappers/error-mapper';

const letterRepo = createLetterRepository();
export const patchLetters: APIGatewayProxyHandler = async (event) => {

  try {
    const supplierId = assertNotEmpty(event.headers['nhsd-supplier-id'], errors.ApiErrorDetail.InvalidRequestMissingSupplierId);
    const letterId = assertNotEmpty( event.pathParameters?.id, errors.ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter);
    const body = assertNotEmpty(event.body, errors.ApiErrorDetail.InvalidRequestMissingBody);

    let patchLetterRequest: LetterApiDocument;

    try {
      patchLetterRequest = LetterApiDocumentSchema.parse(JSON.parse(body));
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(errors.ApiErrorDetail.InvalidRequestBody, error.message, error);
      }
      else throw error;
    }

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
