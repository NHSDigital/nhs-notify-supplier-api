import {
  APIGatewayAuthorizerResult,
  APIGatewayEventClientCertificate,
  APIGatewayRequestAuthorizerEvent,
  APIGatewayRequestAuthorizerEventHeaders,
  APIGatewayRequestAuthorizerHandler,
  Callback,
  Context,
} from "aws-lambda";
import { Supplier } from "@internal/datastore";
import { Deps } from "./deps";

export default function createAuthorizerHandler(
  deps: Deps,
): APIGatewayRequestAuthorizerHandler {
  return (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
    callback: Callback<APIGatewayAuthorizerResult>,
  ): void => {
    checkCertificateExpiry(event.requestContext.identity.clientCert, deps);

    getSupplier(event.headers, deps)
      .then((supplier: Supplier) => {
        deps.logger.info({
          description: "Allowed event",
          methodArn: event.methodArn,
          supplierId: supplier.id,
        });
        callback(null, generateAllow(event.methodArn, supplier.id));
      })
      .catch((error) => {
        deps.logger.warn({
          description: "Denied event",
          err: error,
          methodArn: event.methodArn,
        });
        callback(null, generateDeny(event.methodArn));
      });
  };
}

async function getSupplier(
  headers: APIGatewayRequestAuthorizerEventHeaders | null,
  deps: Deps,
): Promise<Supplier> {
  const apimId = Object.entries(headers || {}).find(
    ([headerName, _]) =>
      headerName.toLowerCase() ===
      deps.env.APIM_SUPPLIER_ID_HEADER.toLowerCase(),
  )?.[1] as string;

  if (!apimId) {
    throw new Error("No APIM application ID found in header");
  }
  const supplier = await deps.supplierRepo.getSupplierByApimId(apimId);
  if (supplier.status === "DISABLED") {
    throw new Error(`Supplier ${supplier.id} is disabled`);
  }
  return supplier;
}

function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
): APIGatewayAuthorizerResult {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
  return authResponse;
}

function generateAllow(
  resource: string,
  supplierId: string,
): APIGatewayAuthorizerResult {
  return generatePolicy(supplierId, "Allow", resource);
}

function generateDeny(resource: string): APIGatewayAuthorizerResult {
  return generatePolicy("invalid-user", "Deny", resource);
}

function getCertificateExpiryInDays(
  certificate: APIGatewayEventClientCertificate,
): number {
  const now = Date.now();
  const expiry = new Date(certificate.validity.notAfter).getTime();
  return (expiry - now) / (1000 * 60 * 60 * 24);
}

function buildCloudWatchMetric(
  namespace: string,
  certificate: APIGatewayEventClientCertificate,
) {
  return {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: namespace,
          Dimensions: ["SUBJECT_DN", "NOT_AFTER"],
          Metrics: [
            {
              Name: "apim-client-certificate-near-expiry",
              Unit: "Count",
              Value: 1,
            },
          ],
        },
      ],
    },
    SUBJECT_DN: certificate.subjectDN,
    NOT_AFTER: certificate.validity.notAfter,
    "apim-client-certificate-near-expiry": 1,
  };
}

async function checkCertificateExpiry(
  certificate: APIGatewayEventClientCertificate | null,
  deps: Deps,
): Promise<void> {
  deps.logger.info({
    description: "Client certificate details",
    issuerDN: certificate?.issuerDN || "-",
    subjectDN: certificate?.subjectDN || "-",
    validity: certificate?.validity || "-",
  });

  if (!certificate) {
    // In a real production environment, we won't have got this far if there wasn't a cert
    return;
  }

  const expiry = getCertificateExpiryInDays(certificate);

  if (expiry <= deps.env.CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS) {
    const metric = buildCloudWatchMetric(
      deps.env.CLOUDWATCH_NAMESPACE,
      certificate,
    );
    deps.logger.warn(metric, `APIM Certificated expiry in ${expiry} days`);
    console.log(JSON.stringify(metric));
  }
}
