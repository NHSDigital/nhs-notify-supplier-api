import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { LetterRepository } from '../../../../internal/datastore'
import pino from 'pino';
import { getLetterIdsForSupplier } from '../services/get-letter-ids';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const log = pino();
const config = {
  lettersTableName: process.env.LETTERS_TABLE_NAME!,
  ttlHours: parseInt(process.env.LETTER_TTL_HOURS!),
};

const letterRepo = new LetterRepository(docClient, log, config);

export const getLetters: APIGatewayProxyHandler = async (event) => {

  if (event.path === '/letters') {

    const supplierId = event.headers['nhsd-apim-apikey'] ?? "supplier1";

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
