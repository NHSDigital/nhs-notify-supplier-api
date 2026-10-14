<<<<<<< HEAD
import populateStandardBreaches from "../handler/populate-standard-breaches";
=======
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
>>>>>>> 68020529 (Create common package)

describe("populateStandardBreaches", () => {
  it("returns a success result", async () => {
    const result = await populateStandardBreaches({ date: "2026-10-08" });

    expect(result).toEqual({
      status: "SUCCESS",
      message: "populate-standard-breaches invoked successfully",
    });
  });
});
