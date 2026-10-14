import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  StartQueryExecutionCommand,
} from "@aws-sdk/client-athena";
import runAthenaQuery from "../athena";
import { type Deps } from "../deps";

const query = { queryString: "SELECT ?", executionParameters: ["'a'"] };

const deps = {
  athenaClient: { send: jest.fn() } as unknown as AthenaClient,
  logger: { info: jest.fn(), debug: jest.fn() },
  env: {
    ATHENA_WORKGROUP: "workgroup",
    ATHENA_DATABASE: "database",
    EVENT_CACHE_TABLE_NAME: "event_cache",
  },
} as unknown as Deps;

const columnInfo = { ColumnInfo: [{ Name: "id" }, { Name: "status" }] };

function mockResolvedValues(fn: any, returnValues: any[]) {
  for (const value of returnValues) {
    (fn as jest.Mock).mockResolvedValueOnce(value);
  }
}

describe("runAthenaQuery", () => {
  it("starts the query, polls until complete and returns paginated rows", async () => {
    mockResolvedValues(deps.athenaClient.send, [
      { QueryExecutionId: "qid" },
      { QueryExecution: { Status: { State: "QUEUED" } } },
      { QueryExecution: { Status: { State: "RUNNING" } } },
      { QueryExecution: { Status: { State: "SUCCEEDED" } } },
      {
        ResultSet: {
          ResultSetMetadata: columnInfo,
          Rows: [
            { Data: [{ VarCharValue: "id" }, { VarCharValue: "status" }] },
            { Data: [{ VarCharValue: "1" }, { VarCharValue: "PENDING" }] },
          ],
        },
        NextToken: "next",
      },
      {
        ResultSet: {
          ResultSetMetadata: columnInfo,
          Rows: [{ Data: [{ VarCharValue: "2" }, {}] }],
        },
      },
    ]);

    const rows = await runAthenaQuery(deps, query, { pollIntervalMs: 0 });

    expect(rows).toEqual([
      { id: "1", status: "PENDING" },
      { id: "2", status: undefined },
    ]);
    const commands = (deps.athenaClient.send as jest.Mock).mock.calls.map(
      ([command]) => command,
    );
    expect(commands[0]).toBeInstanceOf(StartQueryExecutionCommand);
    expect(commands[0].input).toEqual({
      QueryString: "SELECT ?",
      ExecutionParameters: ["'a'"],
      WorkGroup: "workgroup",
      QueryExecutionContext: { Database: "database" },
    });
    expect(commands[1]).toBeInstanceOf(GetQueryExecutionCommand);
    expect(commands[4]).toBeInstanceOf(GetQueryResultsCommand);
    expect(commands[5].input).toEqual({
      QueryExecutionId: "qid",
      NextToken: "next",
    });
  });

  it("handles empty result sets and missing metadata", async () => {
    mockResolvedValues(deps.athenaClient.send, [
      { QueryExecutionId: "qid" },
      { QueryExecution: { Status: { State: "SUCCEEDED" } } },
      {
        ResultSet: { ResultSetMetadata: { ColumnInfo: [{}] }, Rows: [{}, {}] },
      },
    ]);

    await expect(runAthenaQuery(deps, query)).resolves.toEqual([
      { "": undefined },
    ]);
  });

  it("handles a response with no result set", async () => {
    mockResolvedValues(deps.athenaClient.send, [
      { QueryExecutionId: "qid" },
      { QueryExecution: { Status: { State: "SUCCEEDED" } } },
      {},
    ]);

    await expect(runAthenaQuery(deps, query)).resolves.toEqual([]);
  });

  it("uses the default poll interval when none is given", async () => {
    jest.useFakeTimers();
    mockResolvedValues(deps.athenaClient.send, [
      { QueryExecutionId: "qid" },
      {},
      { QueryExecution: { Status: { State: "SUCCEEDED" } } },
      {},
    ]);

    const promise = runAthenaQuery(deps, query);
    await jest.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toEqual([]);
    jest.useRealTimers();
  });

  it("throws when no query execution id is returned", async () => {
    mockResolvedValues(deps.athenaClient.send, [{}]);

    await expect(runAthenaQuery(deps, query)).rejects.toThrow(
      "Athena did not return a query execution id",
    );
  });

  it.each(["FAILED", "CANCELLED"])(
    "throws when the query is %s",
    async (state) => {
      mockResolvedValues(deps.athenaClient.send, [
        { QueryExecutionId: "qid" },
        {
          QueryExecution: {
            Status: { State: state, StateChangeReason: "bad query" },
          },
        },
      ]);

      await expect(runAthenaQuery(deps, query)).rejects.toThrow(
        `Athena query qid ${state}: bad query`,
      );
    },
  );

  it("throws with a default reason when none is given", async () => {
    mockResolvedValues(deps.athenaClient.send, [
      { QueryExecutionId: "qid" },
      { QueryExecution: { Status: { State: "FAILED" } } },
    ]);

    await expect(runAthenaQuery(deps, query)).rejects.toThrow(
      "Athena query qid FAILED: no reason given",
    );
  });
});
