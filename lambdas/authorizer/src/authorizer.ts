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

import {APIGatewayAuthorizerResult, APIGatewayEventClientCertificate, APIGatewayRequestAuthorizerEvent, APIGatewayRequestAuthorizerEventHeaders, APIGatewayRequestAuthorizerHandler,
  Callback, Context } from 'aws-lambda';
import { Deps } from './deps';
import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { Supplier } from '@internal/datastore';

export function createAuthorizerHandler(deps: Deps): APIGatewayRequestAuthorizerHandler {

    return  (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
    callback: Callback<APIGatewayAuthorizerResult>
  ): void => {
    deps.logger.info(event, 'Received event');


    checkCertificateExpiry(event.requestContext.identity.clientCert, deps)
      .then(() => getSupplier(event.headers, deps))
      .then((supplier: Supplier) => {
        deps.logger.info('Allow event');
        callback(null, generateAllow(event.methodArn, supplier.id));
      })
      .catch((error) => {
        deps.logger.info(error, 'Deny event');
        callback(null, generateDeny(event.methodArn));
      });
  };
}

async function getSupplier(headers: APIGatewayRequestAuthorizerEventHeaders | null, deps: Deps): Promise<Supplier> {
  const apimId = Object.entries(headers || {})
    .find(([headerName, _]) => headerName.toLowerCase() === deps.env.APIM_APPLICATION_ID_HEADER)?.[1] as string;

    if(!apimId) {
      throw new Error('No APIM application ID found in header');
    }
    const supplier = await deps.supplierRepo.getSupplierByApimId(apimId);
    if (supplier.status === 'DISABLED') {
      throw new Error(`Supplier ${supplier.id} is disabled`);
    }
    return supplier;
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
    };
    return authResponse;
  }

function generateAllow(resource: string, supplierId: string): APIGatewayAuthorizerResult {
  return generatePolicy(supplierId, 'Allow', resource);
}

function generateDeny(resource: string): APIGatewayAuthorizerResult {
  return generatePolicy('invalid-user', 'Deny', resource);
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

  certificate = certificate || {subjectDN: 'CN=123', validity: {notAfter: '2025-11-06T12:00:00Z'}} as unknown as APIGatewayEventClientCertificate;

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
