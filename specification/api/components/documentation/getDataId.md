## Overview

Download the data file for a letter via a redirect to a signed URL.

Rate limiting applies. On excess requests, you may receive **429 Too Many Requests** (example error code(s): `NOTIFY_QUOTA`). Back off and retry later

## Sandbox test scenarios

You can test the following scenarios in our sandbox environment.

|Scenario|Request ID|Response|
|--------|-------|--------|
|Success  | 2AL5eYSWGzCHlGmzNxuqVusPxDg | Returns 303 (See Other) and URL to [http://example.com](http://example.com) in the Location header |
|Not Found |2WL5eYSWGzCHlGmzNxuqVusPxDg | Returns 404 Not found and error details in the response |
