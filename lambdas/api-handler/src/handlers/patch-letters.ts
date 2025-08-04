import { APIGatewayProxyHandler } from 'aws-lambda';

export const patchLetters: APIGatewayProxyHandler = async (event) => {

  const pathParameters = event.pathParameters || {};
  const letterId = pathParameters["id"];

  if (event.path.includes('/letters/') && letterId) {

    if (!event.body)
    {
      return {
        statusCode: 400,
        body: "Bad Request"
      }
    }

    const body: PatchLetterRequestBody = JSON.parse(event.body);

    return {
      statusCode: 200,
      body: JSON.stringify(body, null, 2)
    };
  }

  return {
    statusCode: 404,
    body: 'Not Found',
  };
};

export interface LetterAttributes {
  reasonCode: number;
  reasonText: string;
  requestedProductionStatus: 'ACTIVE' | 'HOLD' | 'CANCEL';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PRINTED' | 'ENCLOSED' | 'CANCELLED' | 'DISPATCHED' | 'FAILED' | 'RETURNED' | 'DESTROYED' | 'FORWARDED';
}

export interface LetterData {
  id: string;
  type: 'Letter';
  attributes: LetterAttributes;
}

export interface PatchLetterRequestBody {
  data: LetterData;
}
