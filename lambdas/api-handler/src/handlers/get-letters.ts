import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const storedLetters: string[] = ["l1", "l2", "l3"];

export const getLetters: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  if (event.path === '/letters') {

    const response = createGetLettersResponse(event.path, storedLetters);

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
