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
- **Sandbox tests**: We need to start the sandbox server from the `/sandbox` folder in the root directory (read /sandbox/README.md for more information).
  - Run locally:
    1. from project's root directory `cd sandbox && npm install && npm start` to start the sandbox server
    2. from project's root directory `make test-sandbox` or `pnpm install && pnpm --filter nhs-notify-supplier-api-tests run test:sandbox` to run the tests
  - Run in Pipeline:
    1. You need to deploy the proxies in your Pull Request with the label `deploy-proxy`. This should then build the sandbox server, deploy the artifact and deploy the sandbox proxy via proxygen (you might need to re-run the acceptance tests stage in the pipeline, as the server might take some time to deploy and be unreachable from the tests).
- **Performance test** require AWS credentials and deployed infrastructure.
  1. Deploy a dynamic environment (can be achieved by creating a Pull Request). Take a note of the environment e.g. pr1234.
  2. In the root level create an `.env` file and setup the `GITHUB_TOKEN`, `TARGET_ENVIRONMENT`, `TARGET_ACCOUNT_GROUP`, `API_ENVIRONMENT` variables. (use `.env.template` as a guide)
  3. Source the env file by running `set -a` -> `source .env` -> `set +a`
  4. Login to your AWS account by running `aws sso login` in the terminal
- **E2E tests** require AWS credentials, deployed infrastructure and require seeded test data. See `scripts/test-data/` for test data generation and `tests/e2e-tests/README.md` for environment-specific setup.
  1. Deploy a dynamic environment (can be achieved by creating a Pull Request). Take a note of the environment e.g. pr1234.
  2. Build proxies in the dynamic environment by setting the label `deploy_proxy` (ask a member of the team if you need help)
  3. In the root level create an `.env` file and setup the `GITHUB_TOKEN`, `TARGET_ENVIRONMENT`, `TARGET_ACCOUNT_GROUP`, `PROXY_NAME`, `API_ENVIRONMENT`, `NON_PROD_API_KEY`, `NON_PROD_SECONDARY_API_KEY`, `STATUS_ENDPOINT_API_KEY` & `NON_PROD_PRIVATE_KEY` variables. (use `/.env.template` and `/tests/e2e-tests/README.md` as a guide)
  4. Source the env file by running `set -a` -> `source .env` -> `set +a`
  5. Login to your AWS account by running `aws sso login` in the terminal

## Running Tests

Unit tests:

```bash
pnpm run test:unit
```

Exceptionally, this workspace doesn't contain any unit tests. See top package file for other workspaces.

Component, sandbox, and performance tests (from `tests` workspace):

```bash
pnpm run test:component
pnpm run test:sandbox
pnpm run test:performance
```

Pact tests:

```bash
pnpm run test:pact
make test-contract (from root level Makefile)
```

E2E tests (require AWS credentials and environment configuration):

```bash
make .internal-dev-test (from root level Makefile)
```

## Writing Component Tests Against Shared State

All suites run against the same deployed environment, and most tests use `supplier1`. In CI, `.github/actions/test-types.json` lists `component-then-e2e`, so the component and e2e suites run one after the other in one job. Sandbox tests run in parallel because they don't touch AWS state. To keep the suites stable:

- **`GET /letters` changes state.** Every letter it returns is hidden for the visibility timeout (10s on dev), and a call returns at most `limit` letters out of the whole supplier backlog. Don't assume a single call returns the letters your test created. Prefer `GET /letters/{id}` to wait for a letter, or retry until one response contains everything you need (see `getLetterIdsContainingAll`). Specs that call the list endpoint belong in `component-tests/letter-list-tests/`, a Playwright project that runs one spec at a time so they don't hide each other's letters. Never assert that `GET /letters` returns nothing; assert on your own letter IDs instead.
- **Supplier quotas are shared counters.** The allocator updates the daily and per-volume-group allocation rows in the supplier-quotas table. Tests that overwrite those counters, or assert exact totals, belong in `component-tests/allocation-serial-tests/`. That Playwright project runs with one worker after `allocation-tests` and `events-tests`. Always restore counters in `finally`, with a relative change (`adjustSupplierDailyAllocation`) rather than an absolute value.
- **The `supplier-allocator-dlq` queue is shared.** On `main` it also collects events from other teams' environments, so it can hold thousands of messages. `pollQueueForLetterEvent` checks up to 50 messages per round and puts non-matching ones straight back, so parallel specs don't hide each other's messages. It deletes only the message the test produced. SQS can't search, so a backlog of thousands of messages can still make these tests time out.
- **Clean up letters you create.** A PENDING letter stays in the supplier's letter queue until its 7-day TTL and is returned by every later `GET /letters` call. Call `acceptTestLetters` in a `finally` block or `afterEach`. It PATCHes the letters to ACCEPTED, which removes them from the queue, and it never fails the test.
- **Allocation dates use Europe/London.** Use `getAllocationDate()` rather than `new Date().toISOString()`.

<!-- TODO: CCM-12345 Only the letter-list-tests specs clean up so far. The events-tests and allocation-tests specs still leave supplier1 letters PENDING; add acceptTestLetters to them. -->
