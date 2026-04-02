# E2E Tests

### Set Proxy Name

Set the `PROXY_NAME` environment variable to specify the environment for test execution. You can find the proxy name by logging into [Apigee](https://apigee.com/edge), navigating to 'API Proxies' and searching for 'supplier-api' for lower environments like internal-dev.

```shell
export PROXY_NAME=nhs-notify-supplier--internal-dev--nhs-notify-supplier
```

Available values for `PROXY_NAME` include:

* `nhs-notify-supplier--internal-dev--nhs-notify-supplier`
* `nhs-notify-supplier--internal-dev--nhs-notify-supplier-pr<num>`

### Set Up API Keys

Set the following environment variables to use the Apigee API keys:

```shell
export NON_PROD_API_KEY=******
export STATUS_ENDPOINT_API_KEY=******
```

The values have been redacted here but you can obtain them from another team member.
