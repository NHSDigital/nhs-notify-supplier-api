## Overview

Get a LIST of **PENDING** letters that are ready to print .

Returns letters whose `status` is **PENDING**.
Use `limit` to control list size (max 2500).

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later
