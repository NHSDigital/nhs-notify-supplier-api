## Overview

Use this endpoint to poll letters which are ready to be printed.

Returns letters whose `status` is **PENDING**.
Use `limit` to control list size (max 2500).

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later
