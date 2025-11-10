import type { APIGatewayProxyEvent, SQSEvent } from 'aws-lambda';

export function makeApiGwEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    resource: '/{proxy+}',
    path: '/',
    httpMethod: 'GET',
    headers: {
      'NHSD-Supplier-ID': 'supplier1'
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'api-id',
      authorizer: {},
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      identity: {} as any,
      path: '/',
      stage: 'test',
      requestId: 'req-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'res-id',
      resourcePath: '/{proxy+}',
    },
    body: null,
    isBase64Encoded: false,
    ...overrides,
  };
}
