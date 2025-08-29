import { APIGatewayProxyHandler } from 'aws-lambda';
import { getLettersForSupplier } from '../services/letter-operations';
import { createLetterRepository } from '../infrastructure/letter-repo-factory';
import { Letter } from '../../../../internal/datastore/src';

const letterRepo = createLetterRepository();

export const getLetters: APIGatewayProxyHandler = async (event) => {

  if (event.path === '/letters') {

    const supplierId = event.headers['nhsd-supplier-id'];

    if (!supplierId) {
      return {
        statusCode: 400,
        body: "Bad Request: Missing supplier ID"
      };
    }

    const status = event.queryStringParameters?.status;

    if (!status) {
      return {
        statusCode: 400,
        body: "Bad Request: Missing required query parameter 'status'",
      };
    }

    let size = event.queryStringParameters?.size;

    if (!size) {
      size = '10';
    }

    const cursor = event.queryStringParameters?.cursor;

    const letters = await getLettersForSupplier(supplierId, status, Number(size), letterRepo, cursor);

    const response = createGetLettersResponse(event.path, letters, supplierId);

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

type LetterResponse = Omit<Letter, "supplierId" | "supplierStatus" | "ttl">;


interface GetLettersResponse {
  links: GetLettersLinks;
  data: {
    type: 'Letters';
    supplierId: string;
    attributes: {
      letters: Array<LetterResponse>;
    }
  };
}

function createGetLettersResponse(
  baseUrl: string,
  letters: Letter[],
  supplierId: string,
): GetLettersResponse {
  return {
    links: {
      self: `${baseUrl}?page=1`,
      first: `${baseUrl}?page=1`,
      last: `${baseUrl}?page=1`,
      next: `${baseUrl}?page=1`,
      prev: `${baseUrl}?page=1`
    },
    data: {
      type: 'Letters',
      supplierId,
      attributes: {
        letters: letters.map((letter) => ({
          id: letter.id,
          specificationId: letter.specificationId,
          groupId: letter.groupId,
          url: letter.url,
          status: letter.status,
          createdAt: letter.createdAt,
          updatedAt: letter.updatedAt,
        })),
      }
  }
  };
}
