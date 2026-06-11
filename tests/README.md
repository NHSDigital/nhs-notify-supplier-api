<!-- vale off -->

# Tests

## Purpose

Test suites that validate the supplier API beyond individual package unit tests. Each suite targets a different layer of the system.

## Test Suites

| Suite           | Location                                         | Framework   | Description                                                                                           |
| --------------- | ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| **Component**   | `tests/component-tests/`                         | Playwright  | API Gateway integration tests that exercise endpoints directly in an AWS environment with seeded data |
| **Sandbox**     | `tests/sandbox/`                                 | Playwright  | Tests against the sandbox Express server to validate mock API behaviour                               |
| **Performance** | `tests/performance/`                             | Playwright  | Load and latency tests against deployed environments                                                  |
| **Pact**        | `tests/pact-tests/`, `tests/contracts/provider/` | Pact + Jest | Consumer-driven contract tests ensuring API compatibility with known consumers                        |
| **E2E**         | `tests/e2e-tests/`                               | pytest      | End-to-end tests targeting generated proxies and AWS environments                                     |

## Prerequisites

- **Unit and Pact tests**: There are no prerequisites as they run locally with no external dependencies.
- **Component tests** require a running AWS login and a deployed environment:
  1. Deploy a dynamic environment (can be achieved by creating a Pull Request). Take a note of the environment e.g. pr1234
  2. In the root level create an `.env` file and setup the `GITHUB_TOKEN` and `TARGET_ENVIRONMENT` variables (use `.env.template` as a guide)
  3. Source the env file by running `set -a` -> `source .env` -> `set +a`
  4. Login to your AWS account by running `aws sso login` in the terminal
- **Sandbox tests** require a sandbox server.
- **Performance and E2E tests** require AWS credentials, deployed infrastructure, and seeded test data. See `scripts/test-data/` for test data generation and `tests/e2e-tests/README.md` for environment-specific setup.
  1. Deploy a dynamic environment (can be achieved by creating a Pull Request). Take a note of the environment e.g. pr1234.
  2. Build proxies in the dynamic environment by setting the label `deploy_proxy` (ask a member of the team if you need help)
  3. In the root level create an `.env` file and setup the `GITHUB_TOKEN`, `TARGET_ENVIRONMENT`, `TARGET_ACCOUNT_GROUP`, `PROXY_NAME`, `API_ENVIRONMENT`, `NON_PROD_API_KEY`, `STATUS_ENDPOINT_API_KEY` & `NON_PROD_PRIVATE_KEY` variables. (use `.env.template` as a guide)
  4. Source the env file by running `set -a` -> `source .env` -> `set +a`
  5. Login to your AWS account by running `aws sso login` in the terminal

## Running Tests

Unit tests:

```bash
npm run test:unit
```

Exceptionally, this workspace doesn't contain any unit tests. See top package file for other workspaces.

Component, sandbox, and performance tests (from `tests` workspace):

```bash
npm run test:component
npm run test:sandbox
npm run test:performance
```

Pact tests:

```bash
npm run test:pact
make test-contract (from root level Makefile)
```

E2E tests (require AWS credentials and environment configuration):

```bash
make .internal-dev-test (from root level Makefile)
```

<!-- vale on -->
