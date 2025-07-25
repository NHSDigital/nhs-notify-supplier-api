// Replace me with the actual code for your Lambda function
import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const helloWorld: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path || '/';

  if (path === '/') {
    return {
      statusCode: 200,
      body: 'Hello World',
    };
  }

  return {
    statusCode: 404,
    body: 'Not Found',
  };
};
