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

import {APIGatewayAuthorizerResult, APIGatewayEventClientCertificate, APIGatewayRequestAuthorizerEvent, APIGatewayRequestAuthorizerHandler,
  Callback, Context } from 'aws-lambda';
import { Deps } from './deps';
import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export function createAuthorizerHandler(deps: Deps): APIGatewayRequestAuthorizerHandler {

    return  (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
    callback: Callback<APIGatewayAuthorizerResult>
  ): void => {
    deps.logger.info(event, 'Received event');

    const headers = event.headers || {};

    checkCertificateExpiry(event.requestContext.identity.clientCert, deps).then(() => {
      // Perform authorization to return the Allow policy for correct parameters and
      // the 'Unauthorized' error, otherwise.
      if (
        headers['headerauth1'] === 'headervalue1'
      ) {
        deps.logger.info('Allow event');
        callback(null, generateAllow('me', event.methodArn));
      } else {
        deps.logger.info('Deny event');
        callback(null, generateDeny('me', event.methodArn));
      }
    });
  };
}


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

function getCertificateExpiryInDays(certificate: APIGatewayEventClientCertificate): number {
  const now = new Date().getTime();
  const expiry = new Date(certificate.validity.notAfter).getTime();
  return (expiry - now)  / (1000 * 60 * 60 * 24);
}

async function checkCertificateExpiry(certificate: APIGatewayEventClientCertificate | null, deps: Deps): Promise<void> {
  deps.logger.info({
    description: 'Client certificate details',
    issuerDN: certificate?.issuerDN,
    subjectDN: certificate?.subjectDN,
    validity: certificate?.validity,
  });

  if (!certificate) {
    // In a real production environment, we won't have got this far if there wasn't a cert
    return;
  }

  const expiry = getCertificateExpiryInDays(certificate);

  if (expiry <= deps.env.CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS) {
    const { subjectDN, validity } = certificate;

    deps.logger.info({
      description: 'Client certificate near expiry',
      certificateExpiry: validity.notAfter,
      subjectDN,
    });
    await deps.cloudWatchClient.send(buildCloudWatchCommand(deps.env.CLOUDWATCH_NAMESPACE, certificate));
  }

  function buildCloudWatchCommand(namespace: string, certificate: APIGatewayEventClientCertificate): PutMetricDataCommand {
    return new PutMetricDataCommand({
      MetricData: [{
        MetricName: 'apim-client-certificate-near-expiry',
        Dimensions: [
          {Name: 'SUBJECT_DN', Value: certificate.subjectDN},
          {Name: 'NOT_AFTER', Value: certificate.validity.notAfter}
        ]
      }],
      Namespace: namespace
    });
  }
};
