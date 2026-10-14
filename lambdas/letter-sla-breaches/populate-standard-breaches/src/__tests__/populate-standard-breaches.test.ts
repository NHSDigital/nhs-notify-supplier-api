import runAthenaQuery from "../handler/athena";
import { Deps } from "../handler/deps";
import createHandler from "../handler/populate-standard-breaches";
import buildStandardBreachesQuery from "../handler/standard-breaches-query";

jest.mock("../handler/athena");

const makeDeps = () =>
  ({
    logger: { info: jest.fn(), error: jest.fn() },
    env: { EVENT_CACHE_TABLE_NAME: "event_cache" },
  }) as unknown as Deps;

describe("populateStandardBreaches", () => {
  it("runs the standard breaches query and returns success", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([{ date: "2026-10-08" }]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(runAthenaQuery).toHaveBeenCalledWith(
      deps,
      buildStandardBreachesQuery("event_cache", "2026-10-08"),
    );
    expect(result).toEqual({ status: "SUCCESS", rowsReturned: 1 });
  });

  it("returns failure when the query fails", async () => {
    const deps = makeDeps();
    jest
      .mocked(runAthenaQuery)
      .mockRejectedValueOnce(new Error("query failed"));

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(result).toEqual({
      status: "FAILURE",
      failureReason: "query failed",
      rowsReturned: 0,
    });
    expect(deps.logger.error).toHaveBeenCalledWith(
      { date: "2026-10-08", error: expect.any(Error) },
      "Failed to populate standard breaches",
    );
  });

  it("returns failure without querying when the date is invalid", async () => {
    const result = await createHandler(makeDeps())({ date: "not-a-date" });

    expect(runAthenaQuery).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "FAILURE",
      failureReason: 'Invalid date "not-a-date", expected YYYY-MM-DD',
      rowsReturned: 0,
    });
  });

  it("returns failure when a non-Error is thrown", async () => {
    jest.mocked(runAthenaQuery).mockRejectedValueOnce("boom");

    const result = await createHandler(makeDeps())({ date: "2026-10-08" });

    expect(result).toEqual({
      status: "FAILURE",
      failureReason: "boom",
      rowsReturned: 0,
    });
  });
});
