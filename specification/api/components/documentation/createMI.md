## Overview

Use this endpoint to send management or operational metrics relating to letter processing and print fulfilment.

When you submit a create management information request, the endpoint will respond with a 201 (Created) response code along with the created data including a unique id for the record or an unsuccessful (4xx/5xx) response.

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later.

## Sandbox test scenarios

You can test the following scenarios in our sandbox environment.

|Scenario|Request|Response|
|--------|-------|--------|
|Success|Request for successful MI record Creation| 201 (Created) with the created management information in the response|
|Invalid Request|Invalid Request for MI record Creation| 400 (Bad Request) with the error details in the body|
|Unknown specification|Request for MI record Creation for unknown spec|404 (Not Found)  with the error details in the body|
