# E2E Tests

## Set Proxy Name

Set the `PROXY_NAME` environment variable to specify the environment for test execution. You can find the proxy name by logging into [Apigee](https://apigee.com/edge), navigating to 'API Proxies' and searching for 'supplier-api' for lower environments like internal-dev.

```shell
export PROXY_NAME=nhs-notify-supplier--internal-dev--nhs-notify-supplier
```

Available values for `PROXY_NAME` include:

- `nhs-notify-supplier--internal-dev--nhs-notify-supplier`
- `nhs-notify-supplier--internal-dev--nhs-notify-supplier-PR-<num>`

## Set Target Environment (only needed for your PR, defaults to main) in the format <pr123>

```shell
export TARGET_ENVIRONMENT=your-pr
```

## Set Up API Keys

Set the following environment variables to use the Apigee API keys:

```shell
export NON_PROD_API_KEY=******
export NON_PROD_SECONDARY_API_KEY=******
export STATUS_ENDPOINT_API_KEY=******
```

Note:  The NON_PROD_API_KEY should be for the Supplier1 app in APIGEE, while the NON_PROD_SECONDARY_API_KEY should
be for the TestSupplier1 app.

The values have been redacted here but you can obtain them from another team member, or check [.env.template](/.env.template) for more information on how to set them up.

## Test Data and Flakiness

- e2e requests go through the Apigee proxy, so the supplier is always the one registered for the app (`supplier1`). That is the same supplier the component tests use, in the same environment.
- `get_pending_letter_ids` seeds letters with the letter-test-data CLI, then waits for each one through `GET /letters/{id}`. Don't use `GET /letters` to find seeded letters: it returns at most `limit` letters out of the whole supplier backlog and hides every letter it returns for the visibility timeout.
- Each test sends a unique `X-Request-ID`. When a request returns a 5xx, `ErrorHandler.handle_retry` prints the request id, response headers and body. Use these to trace the failure in Apigee when nothing shows up in the lambda's CloudWatch logs. Only 429, 502 and 504 are retried.
