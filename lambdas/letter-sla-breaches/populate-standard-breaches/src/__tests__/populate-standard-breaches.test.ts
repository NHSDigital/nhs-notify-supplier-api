import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
import createHandler from "../handler/populate-standard-breaches";

jest.mock("@internal/letter-sla-breaches-common");

const makeDeps = () =>
  ({
    logger: { info: jest.fn(), error: jest.fn() },
    env: { EVENT_CACHE_TABLE_NAME: "event_cache" },
  }) as unknown as Deps;

describe("populateStandardBreaches", () => {
  it("runs the standard breaches query and returns success", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([{ breach_count: "1" }]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(runAthenaQuery).toHaveBeenCalled();
    expect(result).toEqual({ status: "SUCCESS", breachCount: "1" });
  });

  it("sums the breach count across suppliers", async () => {
    const deps = makeDeps();
    jest
      .mocked(runAthenaQuery)
      .mockResolvedValueOnce([
        { supplierid: "a", breach_count: "2" },
        { supplierid: "b", breach_count: "3" },
        { supplierid: "c" },
      ]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(result).toEqual({ status: "SUCCESS", breachCount: "5" });
  });

  it("returns a zero breach count when the query returns no rows", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(result).toEqual({ status: "SUCCESS", breachCount: "0" });
  });

  it("runs the standard breaches query and returns failure", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockRejectedValueOnce(new Error("boom"));

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(runAthenaQuery).toHaveBeenCalled();
    expect(result).toEqual({
      failureReason: "boom",
      status: "FAILURE",
      breachCount: "0",
    });
  });

  it("runs the standard breaches query and returns failure when not an error", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockRejectedValueOnce("boom");

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(runAthenaQuery).toHaveBeenCalled();
    expect(result).toEqual({
      failureReason: "boom",
      status: "FAILURE",
      breachCount: "0",
    });
  });
});
