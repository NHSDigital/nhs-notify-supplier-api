import { APIGatewayProxyHandler } from 'aws-lambda';
import { createLetterRepository } from '../infrastructure/letter-repo-factory';
import { patchLetterStatus } from '../services/letter-operations';
import { LetterApiDocument } from '../contracts/letter-api';
import { NotFoundError, ValidationError } from '../errors';

const letterRepo = createLetterRepository();
export const patchLetters: APIGatewayProxyHandler = async (event) => {

  const supplierId = event.headers['app-supplier-id'];

  if (!supplierId) {
    return {
      statusCode: 400,
      body: "Bad Request: Missing supplier ID"
    };
  }

  const pathParameters = event.pathParameters || {};
  const letterId = pathParameters["id"];

  if (event.path.includes('/letters/') && letterId) {

    if (!event.body)
    {
      return {
        statusCode: 400,
        body: "Bad Request: Missing request body"
      }
    }

    const patchLetterRequest: LetterApiDocument = JSON.parse(event.body);

    try {

      // TODO CCM-11188: Is it worth retrieving the letter first to check if the status is different?

      const result = await patchLetterStatus(patchLetterRequest.data, letterId, supplierId, letterRepo);

      return {
        statusCode: 200,
        body: JSON.stringify(result, null, 2)
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          statusCode: 400,
          body: error.message
        };
      } else if (error instanceof NotFoundError) {
        return {
          statusCode: 404,
          body: error.message
        };
      }
      throw error;
    }
  }

  // TODO CCM-11188: Is this reachable with the API GW?
  return {
    statusCode: 404,
    body: 'Not Found: The requested resource does not exist',
  };
};
