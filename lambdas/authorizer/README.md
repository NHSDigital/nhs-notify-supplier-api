# Authorizer Lambda

## Purpose

API Gateway "REQUEST authorizer" that maps an APIM application identity to an internal supplier ID and returns an IAM Allow/Deny policy. Also monitors client certificate expiry.

## General Flow

1. API Gateway invokes the authorizer with the full request context including headers and mTLS client certificate.
2. The handler checks the client certificate expiry against `CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS`. If the certificate is near expiry, a CloudWatch metric (`apim-client-certificate-near-expiry`) is emitted and a warning is logged.
3. The APIM supplier ID header (configured via `APIM_SUPPLIER_ID_HEADER`) is extracted with a **case-insensitive** lookup across all request headers.
4. `SupplierRepository.getSupplierByApimId()` resolves the APIM application ID to a `Supplier` record from DynamoDB.
5. If the supplier is found and status is not `DISABLED`, an Allow policy is returned with `principalId` set to the internal supplier ID, making it available to all downstream Lambda handlers.
6. If the header is missing, the supplier is not found, or the supplier is `DISABLED`, a Deny policy is returned.

## Key Integration Points

- **API Gateway**: REQUEST authorizer event model with callback-style response (not async return).
- **`SupplierRepository`** from `@internal/datastore`: resolves APIM application IDs to supplier records.
- **CloudWatch Embedded Metrics**: certificate expiry alerts via `metricScope`.

## Nuances and Peculiarities

- The handler uses the **callback pattern** because API Gateway REQUEST authorizers require it, not async return.
- Header matching is case-insensitive (`headerName.toLowerCase()`) to handle inconsistencies in header casing.
- Disabled suppliers are explicitly denied even if the APIM ID lookup succeeds.
- Certificate expiry checking is fire-and-forget; it does not affect the Allow/Deny decision.
- The `principalId` in the Allow policy is the **internal supplier ID** (not the APIM application supplier ID), so all downstream Lambdas receive the resolved identity via `event.requestContext.authorizer.principalId`.
