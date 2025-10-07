## Overview

API for communication suppliers to integrate with NHS Notify.

This specification represents the in-development 'next' version of the API schema
and should be treated as unstable

Use this API to retrieve letters to be printed

## Who can use this API

The NHS Notify Supplier service is intended for suppliers of print services to the [NHS Notify](https://digital.nhs.uk/services/nhs-notify) service

## Related APIs

The [NHS Notify API](https://digital.nhs.uk/developer/api-catalogue/nhs-notify) is used to send messages to citizens via NHS App, email, text message or letter.

## API status and roadmap

This API is [in development](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#statuses) meaning:

* it is available for testing in the integration environment
* we expect to make breaking changes based on developer feedback

## Service Level

TBD

For more details, see [service levels](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#service-levels).

## Technology

This API is a [REST-based](https://digital.nhs.uk/developer/guides-and-documentation/our-api-technologies#basic-rest) API.

We follow the [JSON:API](https://jsonapi.org/) standard for our request and response schemas.

### Response content types

This API can generate responses in the following formats:

* `application/vnd.api+json` - see [JSON:API specification](https://jsonapi.org/format/#introduction)

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
| Sandbox     | `https://sandbox.api.service.nhs.uk/comms` |
| Integration test | `https://int.api.service.nhs.uk/comms` |
| Production | `https://api.service.nhs.uk/comms` |

### Sandbox testing

Our [sandbox environment](https://digital.nhs.uk/developer/guides-and-documentation/testing#sandbox-testing):

* is for early developer testing
* only covers a limited set of scenarios
* is stateless, so does not actually persist any updates
* is open access, so does not allow you to test authorisation

For details of sandbox test scenarios, or to try out sandbox using our 'Try this API' feature, see the documentation for each endpoint.

### Integration testing

Our integration test environment:

* is for formal integration sandbox-testing
* is stateful, so persists updates
* includes authorisation via [signed JWT authentication](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication)

You need to get your software approved by us before it can go live with this API.

You will also need to follow our steps to - TBD
