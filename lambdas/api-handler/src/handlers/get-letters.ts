// Replace me with the actual code for your Lambda function
import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const getLetters: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  if (event.path === '/letters') {
    return {
      statusCode: 200,
      body: 'Here are some letters: [L1, L2, L3]',
    };
  }

  return {
    statusCode: 404,
    body: 'Not Found',
  };
};
