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
  logs: string[];
};

const NODE_READY_TIMEOUT_MS = 60_000;
const NODE_READY_POLL_MS = 500;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// Trino can report "No nodes available to run query" when the coordinator has
// not (or no longer) registered a worker, e.g. just after "SERVER STARTED" or
// on a loaded CI runner. It is raised before execution starts, so retrying is
// safe even for non-idempotent statements.
const isNoNodesError = (error: unknown) =>
  error instanceof Error && error.message.includes("No nodes available");

export async function setupTrinoContainer(): Promise<TrinoContext> {
  // Buffer logs from the start so they are available even if startup fails.
  const logs: string[] = [];
  let container: StartedTestContainer;

  try {
    container = await new GenericContainer(TRINO_IMAGE)
      .withExposedPorts(TRINO_PORT)
      .withWaitStrategy(Wait.forLogMessage("======== SERVER STARTED ========"))
      .withStartupTimeout(120_000)
      .withLogConsumer((stream) => {
        stream.on("data", (chunk) => logs.push(chunk.toString()));
      })
      .start();
  } catch (error) {
    printLogs(logs);
    throw error;
  }

  const endpoint = `http://${container.getHost()}:${container.getMappedPort(TRINO_PORT)}`;
  const context = { container, endpoint, logs };

  try {
    await runTrinoStatement(context, "SELECT 1");
  } catch (error) {
    printLogs(logs);
    await container.stop();
    throw error;
  }

  return context;
}

function printLogs(logs: string[]) {
  // eslint-disable-next-line no-console
  console.error(`Trino container logs:\n${logs.join("")}`);
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
  const deadline = Date.now() + NODE_READY_TIMEOUT_MS;

  for (;;) {
    try {
      return await executeTrinoStatement(context, sql);
    } catch (error) {
      if (!isNoNodesError(error) || Date.now() >= deadline) {
        printLogs(context.logs);
        throw error;
      }
    }

    await sleep(NODE_READY_POLL_MS);
  }
}

async function executeTrinoStatement(
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
