## Overview

Update the status of a single letter by its ID, optionally providing a reason code and text.

When you make a PATCH request with your application, the endpoint will respond with a successful (200) response code, along with the updated patient resource or an unsuccessful (4xx/5xx) response.

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later.

### Statuses

Allowed `status` values that can be used to are:

- `ACCEPTED`
- `CANCELLED`
- `DELIVERED`
- `DESTROYED`
- `DISPATCHED`
- `ENCLOSED`
- `FAILED`
- `FORWARDED`
- `PRINTED`
- `REJECTED`
- `RETURNED`

It is not possible to update a letter to status of `PENDING`.

Optionally a `reasonCode` and `reasonText` explaining the status (for example, validation failures) can be included in the request body.
