import {APIGatewayAuthorizerResult, APIGatewayEventClientCertificate, APIGatewayRequestAuthorizerEvent, APIGatewayRequestAuthorizerEventHeaders, APIGatewayRequestAuthorizerHandler,
  Callback, Context } from 'aws-lambda';
import { Deps } from './deps';
import { Supplier } from '@internal/datastore';

export function createAuthorizerHandler(deps: Deps): APIGatewayRequestAuthorizerHandler {

    return  (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
    callback: Callback<APIGatewayAuthorizerResult>
  ): void => {
    deps.logger.info(event, 'Received event');


    checkCertificateExpiry(event.requestContext.identity.clientCert, deps);

    getSupplier(event.headers, deps)
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
    .find(([headerName, _]) => headerName.toLowerCase() === deps.env.APIM_APPLICATION_ID_HEADER.toLowerCase())?.[1] as string;

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

  if (!certificate) {
    // In a real production environment, we won't have got this far if there wasn't a cert
    return;
  }

  const expiry = getCertificateExpiryInDays(certificate);

  if (expiry <= deps.env.CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS) {
    deps.logger.info(JSON.stringify(buildCloudWatchMetric(deps.env.CLOUDWATCH_NAMESPACE, certificate)));
  }

  function buildCloudWatchMetric(namespace: string, certificate: APIGatewayEventClientCertificate) {
    return {
      _aws: {
        Timestamp: new Date().valueOf(),
        CloudWatchMetrics: [
          {
            Namespace: namespace,
            Dimensions: ['SUBJECT_DN', 'NOT_AFTER'],
            Metrics: [
              {
                Name: 'apim-client-certificate-near-expiry',
                Unit: 'Count',
                Value: 1,
              },
            ],
          },
        ],
      },
      'SUBJECT_DN': certificate.subjectDN,
      'NOT_AFTER':  certificate.validity.notAfter,
      'apim-client-certificate-near-expiry': 1,
    };
  }
};
