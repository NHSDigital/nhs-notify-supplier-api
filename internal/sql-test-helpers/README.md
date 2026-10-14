<!-- vale off -->

# @internal/sql-test-helpers

## Purpose

Test-only helpers for running SQL queries against databases in [testcontainers](https://node.testcontainers.org/), so that query builders can be checked against a real SQL engine using known test data.

## General Structure highlights

- **`src/trino.ts`**: Trino helpers, which talk to Trino over its REST API using `fetch`:
  - `setupTrinoContainer()` — starts a `trinodb/trino` `GenericContainer` and returns a `TrinoContext` (`container`, `endpoint`).
  - `runTrinoStatement(context, sql)` — runs a statement against the built-in `memory` catalog, follows result pagination and returns rows as `Record<string, string | undefined>` (NULL → `undefined`).
  - `runParameterisedQueryOnTrino(context, query)` — runs an Athena-style `{ queryString, executionParameters }` query via `EXECUTE IMMEDIATE ... USING`. Execution parameters are SQL literal expressions, as in Athena (for example `"'2026-10-14T12:00:00.000Z'"`).

## Usage

Add the package as a **devDependency** of the consuming workspace and import it from test code only:

```json
"devDependencies": {
  "@internal/sql-test-helpers": "*"
}
```

```ts
import {
  runParameterisedQueryOnTrino,
  runTrinoStatement,
  setupTrinoContainer,
} from "@internal/sql-test-helpers";

const context = await setupTrinoContainer();
await runTrinoStatement(context, "CREATE TABLE event_cache (...)");
const rows = await runParameterisedQueryOnTrino(context, buildQuery(...));
await context.container.stop();
```

## Nuances and Peculiarities

- Must never be imported by production code. Because consumers list it under `devDependencies`, ESLint's `import-x/no-extraneous-dependencies` rule reports any import from non-test files.
- Has no unit tests of its own and is excluded from coverage (see `sonar.coverage.exclusions` in `scripts/config/sonar-scanner.properties`). It is checked through the tests that use it.
- Tests that use it require Docker. The first run pulls the Trino image (about 1 GB), so allow a generous `beforeAll` timeout (for example `180_000` ms). In CI, the image is pulled in the background at the start of the unit test job in `.github/workflows/stage-2-test.yaml`. If you change `TRINO_IMAGE`, update that step too.
- Trino SQL is close to, but not identical to, Athena's engine version. The helpers check query logic, not every Athena-specific behaviour.

<!-- vale on -->
