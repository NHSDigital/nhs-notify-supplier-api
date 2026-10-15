import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

// Pre-pulled in CI by .github/workflows/stage-2-test.yaml; keep in sync.
const TRINO_IMAGE = "trinodb/trino:476";
const TRINO_PORT = 8080;

// Structurally compatible with Athena's query/row shapes, so Athena query
// builders can be exercised against Trino without depending on them here.
export type SqlQuery = {
  queryString: string;
  executionParameters?: string[];
};

export type SqlRow = Record<string, string | undefined>;

type TrinoResponse = {
  columns?: { name: string }[];
  data?: unknown[][];
  nextUri?: string;
  error?: { message: string };
};

export type TrinoContext = {
  container: StartedTestContainer;
  endpoint: string;
};

export async function setupTrinoContainer(): Promise<TrinoContext> {
  const container = await new GenericContainer(TRINO_IMAGE)
    .withExposedPorts(TRINO_PORT)
    .withWaitStrategy(Wait.forLogMessage("======== SERVER STARTED ========"))
    .withStartupTimeout(120_000)
    .start();

  const endpoint = `http://${container.getHost()}:${container.getMappedPort(TRINO_PORT)}`;

  return { container, endpoint };
}

async function readTrinoResponse(response: Response): Promise<TrinoResponse> {
  if (!response.ok) {
    throw new Error(
      `Trino request failed: ${response.status} ${await response.text()}`,
    );
  }

  const body = (await response.json()) as TrinoResponse;

  if (body.error) {
    throw new Error(`Trino query failed: ${body.error.message}`);
  }

  return body;
}

function toRow(columns: string[], values: unknown[]): SqlRow {
  return Object.fromEntries(
    columns.map((name, i) => {
      const value = values.at(i);
      return [name, value === null ? undefined : String(value)];
    }),
  );
}

// Runs a statement via the Trino REST API against the in-memory catalog.
export async function runTrinoStatement(
  context: TrinoContext,
  sql: string,
): Promise<SqlRow[]> {
  let body = await readTrinoResponse(
    await fetch(`${context.endpoint}/v1/statement`, {
      method: "POST",
      headers: {
        "X-Trino-User": "test",
        "X-Trino-Catalog": "memory",
        "X-Trino-Schema": "default",
      },
      body: sql,
    }),
  );

  let columns: string[] = [];
  const rows: SqlRow[] = [];

  while (true) {
    if (body.columns) {
      columns = body.columns.map((column) => column.name);
    }

    const currentColumns = columns;
    rows.push(
      ...(body.data ?? []).map((values) => toRow(currentColumns, values)),
    );

    if (!body.nextUri) {
      return rows;
    }

    body = await readTrinoResponse(
      await fetch(body.nextUri, { headers: { "X-Trino-User": "test" } }),
    );
  }
}

// Emulates Athena parameterised queries: each execution parameter is
// substituted into the query as a SQL literal expression.
export async function runParameterisedQueryOnTrino(
  context: TrinoContext,
  query: SqlQuery,
): Promise<SqlRow[]> {
  const escapedQuery = query.queryString.replaceAll("'", "''");
  const parameters = query.executionParameters ?? [];
  const using = parameters.length > 0 ? ` USING ${parameters.join(", ")}` : "";

  return runTrinoStatement(
    context,
    `EXECUTE IMMEDIATE '${escapedQuery}'${using}`,
  );
}
