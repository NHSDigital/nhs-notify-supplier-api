# Overview

Use this endpoint to retrieve management or operational metrics relating to letter processing and print fulfilment.

When you submit a get management information request, the endpoint will respond with a 200 (Success) response code along with the created data including a unique id for the record or an unsuccessful (4xx/5xx) response.

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later.

## Sandbox test scenarios

You can test the following scenarios in our sandbox environment.

|Scenario|Request|Response|
|--------|-------|--------|
|Success|Request for successful MI record retrieval|200 (Success) with the retrieved management information in the response|
|Invalid Request|Invalid Request for MI record retrieval|400 (Bad Request) with the error details in the body|
|Unknown specification|Request for MI record retrieval for unknown spec|404 (Not Found)  with the error details in the body|
