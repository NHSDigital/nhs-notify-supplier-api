import {
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  GetQueryResultsCommandOutput,
  QueryExecutionState,
  StartQueryExecutionCommand,
} from "@aws-sdk/client-athena";
import { Deps } from "./deps";

export type AthenaQuery = {
  queryString: string;
  executionParameters?: string[];
};

export type AthenaQueryOptions = {
  pollIntervalMs?: number;
};

export type AthenaRow = Record<string, string | undefined>;

const DEFAULT_POLL_INTERVAL_MS = 1000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function startQuery(deps: Deps, query: AthenaQuery): Promise<string> {
  const { QueryExecutionId } = await deps.athenaClient.send(
    new StartQueryExecutionCommand({
      QueryString: query.queryString,
      ExecutionParameters: query.executionParameters,
      WorkGroup: deps.env.ATHENA_WORKGROUP,
      QueryExecutionContext: { Database: deps.env.ATHENA_DATABASE },
    }),
  );

  if (!QueryExecutionId) {
    throw new Error("Athena did not return a query execution id");
  }

  return QueryExecutionId;
}

async function waitForQuery(
  deps: Deps,
  queryExecutionId: string,
  pollIntervalMs: number,
): Promise<void> {
  while (true) {
    const { QueryExecution } = await deps.athenaClient.send(
      new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId }),
    );
    const state = QueryExecution?.Status?.State;

    switch (state) {
      case QueryExecutionState.SUCCEEDED: {
        return;
      }
      case QueryExecutionState.FAILED:
      case QueryExecutionState.CANCELLED: {
        throw new Error(
          `Athena query ${queryExecutionId} ${state}: ${QueryExecution?.Status?.StateChangeReason ?? "no reason given"}`,
        );
      }
      default: {
        deps.logger.debug({ queryExecutionId, state }, "Waiting for query");
        await sleep(pollIntervalMs);
      }
    }
  }
}

function toRows(
  page: GetQueryResultsCommandOutput,
  isFirstPage: boolean,
): AthenaRow[] {
  const columns =
    page.ResultSet?.ResultSetMetadata?.ColumnInfo?.map((c) => c.Name ?? "") ??
    [];
  // For SELECT queries the first row of the first page contains the column headers.
  const rows = (page.ResultSet?.Rows ?? []).slice(isFirstPage ? 1 : 0);

  return rows.map((row) =>
    Object.fromEntries(
      columns.map((column, index) => [
        column,
        row.Data?.at(index)?.VarCharValue,
      ]),
    ),
  );
}

async function getResults(
  deps: Deps,
  queryExecutionId: string,
): Promise<AthenaRow[]> {
  const results: AthenaRow[] = [];
  let nextToken: string | undefined;
  let isFirstPage = true;

  do {
    const page = await deps.athenaClient.send(
      new GetQueryResultsCommand({
        QueryExecutionId: queryExecutionId,
        NextToken: nextToken,
      }),
    );
    results.push(...toRows(page, isFirstPage));
    nextToken = page.NextToken;
    isFirstPage = false;
  } while (nextToken);

  return results;
}

export default async function runAthenaQuery(
  deps: Deps,
  query: AthenaQuery,
  options: AthenaQueryOptions = {},
): Promise<AthenaRow[]> {
  const queryExecutionId = await startQuery(deps, query);
  deps.logger.info({ description: "Started Athena query", query });

  await waitForQuery(
    deps,
    queryExecutionId,
    options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
  );

  return getResults(deps, queryExecutionId);
}
