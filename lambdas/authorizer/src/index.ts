// A simple request-based authorizer example to demonstrate how to use request
// parameters to allow or deny a request. In this example, a request is
// authorized if the client-supplied HeaderAuth1 header and stage variable of StageVar1
// both match specified values of 'headerValue1' and 'stageValue1', respectively.
//
// Example curl request (replace <api-url> and <stage> as appropriate):
//
//   curl -H "HeaderAuth1: headerValue1" \
//        "<api-url>/<stage>/your-resource"
//

// See https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html for the original JS documentation

import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent, Callback, Context } from 'aws-lambda';
import pino from 'pino';

export const handler = (
  event: APIGatewayRequestAuthorizerEvent,
  context: Context,
  callback: Callback<APIGatewayAuthorizerResult>,
  log = pino()
): void => {
  log.info(event, 'Received event');

  const headers = event.headers || {};

  // Perform authorization to return the Allow policy for correct parameters and
  // the 'Unauthorized' error, otherwise.
  if (
    headers['headerauth1'] === 'headervalue1'
  ) {
    log.info('Allow event');
    callback(null, generateAllow('me', event.methodArn));
  } else {
    log.info('Deny event');
    callback(null, generateDeny('me', event.methodArn));
  }
};

// Helper function to generate an IAM policy
function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string
): APIGatewayAuthorizerResult {
  // Required output:
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: {
      stringKey: 'stringval',
      numberKey: 123,
      booleanKey: true,
    },
  };
  return authResponse;
}

function generateAllow(principalId: string, resource: string): APIGatewayAuthorizerResult {
  return generatePolicy(principalId, 'Allow', resource);
}

function generateDeny(principalId: string, resource: string): APIGatewayAuthorizerResult {
  return generatePolicy(principalId, 'Deny', resource);
}
