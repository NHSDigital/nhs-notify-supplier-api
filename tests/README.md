# Tests

## Purpose

Test suites that validate the supplier API beyond individual package unit tests. Each suite targets a different layer of the system.

## Test Suites

| Suite | Location | Framework | Description |
| --- | --- | --- | --- |
| **Component** | `tests/component-tests/` | Playwright | API Gateway integration tests that exercise endpoints directly in an AWS environment with seeded data |
| **Sandbox** | `tests/sandbox/` | Playwright | Tests against the sandbox Express server to validate mock API behaviour |
| **Performance** | `tests/performance/` | Playwright | Load and latency tests against deployed environments |
| **Pact** | `tests/pact-tests/`, `tests/contracts/provider/` | Pact + Jest | Consumer-driven contract tests ensuring API compatibility with known consumers |
| **E2E** | `tests/e2e-tests/` | pytest | End-to-end tests targeting generated proxies and AWS environments |

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
make test-contract
```

E2E tests (require AWS credentials and environment configuration):

```bash
make .internal-dev-test
```

## Prerequisites

# TODO

- **Unit and Pact tests** run locally with no external dependencies.
- **Component tests** require a running AWS login and a deployed environment.
- **Sandbox tests** require a sandbox server.
- **Performance and E2E tests** require AWS credentials, deployed infrastructure, and seeded test data. See `scripts/test-data/` for test data generation and `tests/e2e-tests/README.md` for environment-specific setup.
