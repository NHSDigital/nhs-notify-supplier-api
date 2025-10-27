## Overview

Use this endpoint to get the current status of a single letter by its ID.

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later

## Sandbox test scenarios

You can test the following scenarios in our sandbox environment

| Scenario                                | Letter Id                    |
| ----------------------------------------| ---------------------------- |
| Retrieve a PENDING letter status        | `24L5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a ACCEPTED letter status       | `2AL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a PRINTED letter status        | `2BL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a ENCLOSED letter status       | `2CL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a DISPATCHED letter status     | `2DL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a DELIVERED letter status      | `2EL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a REJECTED letter status       | `2WL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a CANCELLED letter status      | `2XL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a FAILED letter status         | `2YL5eYSWGzCHlGmzNxuqVusPxDg`|
| Retrieve a RETURNED letter status       | `2ZL5eYSWGzCHlGmzNxuqVusPxDg`|
