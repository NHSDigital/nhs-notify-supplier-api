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
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([{ date: "2026-10-08" }]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(runAthenaQuery).toHaveBeenCalled();
    expect(result).toEqual({ status: "SUCCESS", rowsReturned: 1 });
  });

  it("runs the standard breaches query and returns failure", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockRejectedValueOnce(new Error("boom"));

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(runAthenaQuery).toHaveBeenCalled();
    expect(result).toEqual({
      failureReason: "boom",
      status: "FAILURE",
      rowsReturned: 0,
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
      rowsReturned: 0,
    });
  });
});
