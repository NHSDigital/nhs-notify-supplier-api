## Overview

Use this endpoint to update the status of a letter by submitting the new status in the request body, optionally providing a reason code and text.

When you make a PATCH request with your application, the endpoint will respond with an accepted (202) response code or an unsuccessful (4xx/5xx) response.

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later.

### Statuses

Allowed `status` values that can be used to are:

- `ACCEPTED`
- `CANCELLED`
- `DELIVERED`
- `DISPATCHED`
- `ENCLOSED`
- `FAILED`
- `FORWARDED`
- `PRINTED`
- `REJECTED`
- `RETURNED`

It is not possible to update a letter to status of `PENDING`.

Optionally a `reasonCode` and `reasonText` explaining the status (for example, validation failures) can be included in the request body.

### Example Error Codes

Examples of reason codes and text that may be returned include (but are not limited to)

| Reason Code | Reason Text                |
|-------------|----------------------------|
|R01          |Addressee gone away         |
|R02          |Address incomplete          |
|R03          |Address inaccessible        |
|R04          |Addressee unknown           |
|R05          |Addressee gone away/Refused |
|R06          |Not called for              |
|R07          |No such address             |
|R08          |No reason given             |
|R09          |Deceased                    |
|R10          |Miscellaneous               |
