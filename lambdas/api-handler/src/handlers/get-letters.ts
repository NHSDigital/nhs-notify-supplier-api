import { APIGatewayProxyHandler } from 'aws-lambda';
import { getLetterIdsForSupplier } from '../services/letter-operations';
import { createLetterRepository } from '../infrastructure/letter-repo-factory';

const letterRepo = createLetterRepository();

export const getLetters: APIGatewayProxyHandler = async (event) => {

  if (event.path === '/letters') {

    const supplierId = event.headers['app-supplier-id'];

    if (!supplierId) {
      return {
        statusCode: 400,
        body: "Bad Request: Missing supplier ID"
      };
    }

    const letterIds = await getLetterIdsForSupplier(supplierId, letterRepo);

    const response = createGetLettersResponse(event.path, letterIds);

    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2)
    };
  }

  return {
    statusCode: 404,
    body: 'Not Found',
  };
};

interface GetLettersLinks {
  self: string;
  first: string;
  last: string;
  next?: string;
  prev?: string;
}

interface Resource {
  type: string;
  id: string;
}

interface GetLettersResponse {
  links: GetLettersLinks;
  data: Resource[];
}

function createGetLettersResponse(
  baseUrl: string,
  letters: string[]
): GetLettersResponse {
  return {
    links: {
      self: `${baseUrl}?page=1`,
      first: `${baseUrl}?page=1`,
      last: `${baseUrl}?page=1`,
      next: `${baseUrl}?page=1`,
      prev: `${baseUrl}?page=1`
    },
    data: letters.map((letterId) => ({
      type: "letter",
      id: letterId,
    })),
  };
}
