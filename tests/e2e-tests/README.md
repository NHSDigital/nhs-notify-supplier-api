# E2E Tests

These tests call the Apigee proxy, which then calls our backend. General prerequisites (deployed environment, `deploy-proxy` label, AWS login) are in [tests/README.md](../README.md). All environment variables are documented in [.env.template](../../.env.template) (use the **Common** and **E2E only** sections).

## Variables specific to e2e

- `PROXY_NAME`: the Apigee proxy under test. You can find it by logging into [Apigee](https://apigee.com/edge), navigating to 'API Proxies' and searching for 'supplier-api' for lower environments like internal-dev.
  - `nhs-notify-supplier--internal-dev--nhs-notify-supplier`
  - `nhs-notify-supplier--internal-dev--nhs-notify-supplier-PR-<num>`
- `API_ENVIRONMENT`: the APIM environment (`internal-dev`, `ref`, `int`, `prod`).
- `TARGET_ENVIRONMENT`: your PR environment (e.g. `pr123`) or `main`.
- `NON_PROD_API_KEY` is for the Supplier1 app in Apigee, `NON_PROD_SECONDARY_API_KEY` is for the TestSupplier1 app. `STATUS_ENDPOINT_API_KEY` is used for the `/_status` endpoint. Where to find each value is described in `.env.template`.

## Running

From the repository root, after sourcing `.env`:

```shell
make .e2e-tests
```
