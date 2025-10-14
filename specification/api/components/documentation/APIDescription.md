## Overview

API for letter suppliers to integrate with NHS Notify.

This API lets you:

* Get lists of letters allocated to you
* Download letter PDFs and metadata
* Update and manage letter statuses
* Submit and retrieve management information (MI)

This specification represents the in-development 'next' version of the API schema
and should be treated as unstable

Use this API to retrieve letters to be printed

## Who can use this API

 The NHS Notify Supplier API is designed for approved print service suppliers who support the delivery of physical letters through the [NHS Notify](https://digital.nhs.uk/services/nhs-notify) platform.

## Related APIs

The [NHS Notify API](https://digital.nhs.uk/developer/api-catalogue/nhs-notify) is used to send messages to citizens via NHS App, email, text message or letter.

## API status and roadmap

This API is [in production, beta](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#statuses). We are onboarding partners to use it.

We may make additive non-breaking changes to the API without notice, for example the addition of fields to a response or callback, or new optional fields to a request.

## Service Level

This service is a [silver](https://digital.nhs.uk/services/reference-guide#service-levels) service, meaning it is available 24 hours a day, 365 days a year and supported from 8am to 6pm, Monday to Friday excluding bank holidays.
For more details, see [service levels](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#service-levels).

## Technology

This API is a [REST-based](https://digital.nhs.uk/developer/guides-and-documentation/our-api-technologies#basic-rest) API.

We follow the [JSON:API](https://jsonapi.org/) standard for our request and response schemas.

### Response content types

This API can generate responses in the following format:

* `application/vnd.api+json` - see [JSON:API specification](https://jsonapi.org/format/#introduction)

### Request content types

This API will accept request payloads of the following types:

* `application/vnd.api+json` - see [JSON:API specification](https://jsonapi.org/format/#introduction)
* `application/json`

The `Content-Type` header may optionally include a `charset` attribute. If included, it **must** be set to `charset=utf-8` Any other `charset` value will result in a `406` error response. If omitted then `utf-8` is assumed.

If you attempt to send a payload without the `Content-Type` header set to either of these values then the API will respond with a `415 Unsupported Media Type` response.

## Network access

This API is available on the internet and, indirectly on the [Health and Social Care Network (HSCN)](https://digital.nhs.uk/services/health-and-social-care-network).

For more details see [Network access for APIs](https://digital.nhs.uk/developer/guides-and-documentation/network-access-for-apis).

## Security and authorisation

This API is [application-restricted](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation#application-restricted-apis), meaning we authenticate the calling application but not the end user.

Authentication and authorisation of end users is the responsibility of your application.

To access this API, use the following security pattern:

* [Application-restricted RESTful API - signed JWT authentication](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication)

## Environments and testing

| Environment | Base URL |
|------------ | -------- |
| Sandbox     | `https://sandbox.api.service.nhs.uk/nhs-notify-supplier` |
| Integration test | `https://int.api.service.nhs.uk/nhs-notify-supplier` |
| Production | `https://api.service.nhs.uk/nhs-notify-supplier` |

### Sandbox testing

Our [sandbox environment](https://digital.nhs.uk/developer/guides-and-documentation/testing#sandbox-testing):

* is for early developer testing
* only covers a limited set of scenarios
* is stateless, so does not actually persist any updates
* is open access, so does not allow you to test authorisation

For details of sandbox test scenarios, or to try out sandbox using our 'Try this API' feature, see the documentation for each endpoint.

Alternatively, you can try out the sandbox using our Postman collection

You can find our postman collection source in our [public repository on github](https://github.com/NHSDigital/nhs-notify-supplier-api/tree/main/postman).

### Integration testing

Our integration test environment:

* is for formal integration sandbox-testing
* is stateful, so persists updates
* includes authorisation via [signed JWT authentication](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication)

You need to get your software approved by us before it can go live with this API.

You will also need to follow our steps to - TBD

### Production smoke testing

Before go-live, you must complete a smoke test in the NHS Notify production environment.
The smoke test confirms that your live credentials, connectivity, and print workflow operate correctly end-to-end. It will be carried out in coordination with the NHS Notify Supplier API team.
You will retrieve and print one or more live test letters through the production API, send the printed output to the address provided, and submit a Management Information (MI) update for verification.
The NHS Notify team will configure your production access, review your results, and confirm that your output meets NHS Notify print specifications.

### Onboarding

You need to get your software approved by us before it can go live with this API.
You will also need to be an approved NHS letter supplier under the framework agreement (ADD link) and nominate your technical and operational contacts
