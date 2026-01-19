# E2E Tests

## Generate An Apigee Access Token

To generate authentication using Apigee, you must have access to an Apigee account and use `get_token` via the command line and generate an Apigee access token.

**Tokens expire once per day and require refreshing.**

* Install [`get_token`](https://docs.apigee.com/api-platform/system-administration/auth-tools#install)
* Run the following command and log in with your Apigee credentials when prompted:

```shell
export APIGEE_ACCESS_TOKEN=$(SSO_LOGIN_URL=https://login.apigee.com get_token)
```

* If your token does not refresh, try clearing the cache:

```shell
export APIGEE_ACCESS_TOKEN=$(SSO_LOGIN_URL=https://login.apigee.com get_token --clear-sso-cache)
```

### Set Proxy Name

Set the `PROXY_NAME` environment variable to specify the environment for test execution. You can find the proxy name by logging into [Apigee](https://apigee.com/edge), navigating to 'API Proxies' and searching for 'supplier-api' for lower environments like internal-dev.

```shell
export PROXY_NAME=nhs-notify-supplier--internal-dev--nhs-notify-supplier
```

Available values for `PROXY_NAME` include:

* `nhs-notify-supplier--internal-dev--nhs-notify-supplier`
* `nhs-notify-supplier--internal-dev--nhs-notify-supplier-pr<num>`
