import { runAthenaQuery } from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { type Deps } from "../handler/deps";
import buildStandardBreachesQuery from "../handler/standard-breaches-query";
import createHandler from "../handler/populate-standard-breaches";

jest.mock("@internal/letter-sla-breaches-common");
jest.mock("../handler/standard-breaches-query");

const makeDeps = () =>
  ({
    logger: { info: jest.fn(), error: jest.fn() },
    env: {
      EVENT_CACHE_TABLE_NAME: "event_cache",
      PACK_SPECIFICATION_TABLE_NAME: "pack_specification",
      DAYS_TO_LOOK_BACK: 10,
      STANDARD_SLA_WORKING_DAYS: 3,
    },
  }) as unknown as Deps;

describe("populateStandardBreaches", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    process.env = { ...oldEnv };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it("passes the configured SLA days and look-back to the query", async () => {
    jest.mocked(runAthenaQuery).mockResolvedValue([]);

    await createHandler(makeDeps())({ date: "2026-10-08" });

    expect(buildStandardBreachesQuery).toHaveBeenCalledWith(
      "event_cache",
      "pack_specification",
      new Date("2026-10-08"),
      3,
      10,
    );
  });

  it("runs the standard breaches query and logs total and per-supplier metrics", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValue([
      { supplierid: "supplier1", breach_count: "10" },
      { supplierid: "supplier2", breach_count: "5" },
    ]);
    process.env.AWS_LAMBDA_FUNCTION_NAME = "populate-standard-breaches";

    await createHandler(deps)({ date: "2026-10-08" });

    expect(deps.logger.info as jest.Mock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            {
              Namespace: "populate-standard-breaches",
              Dimensions: [[]],
              Metrics: [
                expect.objectContaining({
                  Name: "StandardBreachTotal",
                  Unit: Unit.Count,
                }),
              ],
            },
          ],
        }),
        StandardBreachTotal: 15,
      }),
    );

    expect(deps.logger.info as jest.Mock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        SupplierId: "supplier1",
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            {
              Namespace: "populate-standard-breaches",
              Dimensions: [["SupplierId"]],
              Metrics: [
                expect.objectContaining({
                  Name: "StandardBreachCount",
                  Unit: Unit.Count,
                }),
              ],
            },
          ],
        }),
        StandardBreachCount: 10,
      }),
    );
    expect(deps.logger.info as jest.Mock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        SupplierId: "supplier2",
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            {
              Namespace: "populate-standard-breaches",
              Dimensions: [["SupplierId"]],
              Metrics: [
                expect.objectContaining({
                  Name: "StandardBreachCount",
                  Unit: Unit.Count,
                }),
              ],
            },
          ],
        }),
        StandardBreachCount: 5,
      }),
    );
  });

  it("logs a total of zero for no breaches", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValue([]);
    process.env.AWS_LAMBDA_FUNCTION_NAME = "populate-standard-breaches";

    await createHandler(deps)({ date: "2026-10-08" });

    expect(deps.logger.info as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            {
              Namespace: "populate-standard-breaches",
              Dimensions: [[]],
              Metrics: [
                expect.objectContaining({
                  Name: "StandardBreachTotal",
                  Unit: Unit.Count,
                }),
              ],
            },
          ],
        }),
        StandardBreachTotal: 0,
      }),
    );
  });
});
