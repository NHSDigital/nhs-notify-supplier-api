## Overview

Use this endpoint to update the status for (example, PRINTED, DISPATCHED, DELIVERED) of multiple letters by providing the new statuses in the request body, optionally including reason codes and text.

Use this endpoint when you need to report status changes for several letters at once.

When you make a POST update request with the endpoint, it will respond with a successful (202) response code or an unsuccessful (4xx/5xx) response.

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

Optionally a `reasonCode` and `reasonText` explaining the status (for example, validation failures) can be included in the request body for each update.

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
