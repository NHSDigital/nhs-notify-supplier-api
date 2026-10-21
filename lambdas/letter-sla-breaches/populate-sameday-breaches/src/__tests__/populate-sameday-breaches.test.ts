import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
import createHandler from "../handler/populate-sameday-breaches";

jest.mock("@internal/letter-sla-breaches-common");

const makeDeps = () =>
  ({
    logger: { info: jest.fn(), error: jest.fn() },
    env: {
      EVENT_CACHE_TABLE_NAME: "event_cache",
      PACK_SPECIFICATION_TABLE_NAME: "pack_specification",
    },
  }) as unknown as Deps;

describe("populateSamedayBreaches", () => {
  it("runs the sameday breaches query and returns success", async () => {
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

  it("logs an EMF breach count metric for each supplier", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([
      {
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        breach_count: "2",
      },
      {
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        breach_count: "3",
      },
    ]);

    await createHandler(deps)({ date: "2026-10-08" });

    expect(deps.logger.info).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        SupplierId: "supplier-a",
        ClientId: "client-a",
        CampaignId: "campaign-a",
        SameDayBreachCount: 2,
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            expect.objectContaining({
              Dimensions: [["SupplierId", "ClientId", "CampaignId"]],
              Metrics: [
                { Name: "SameDayBreachCount", Value: 2, Unit: "Count" },
              ],
            }),
          ],
        }),
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        SupplierId: "supplier-b",
        ClientId: "client-b",
        CampaignId: "campaign-b",
        SameDayBreachCount: 3,
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            expect.objectContaining({
              Dimensions: [["SupplierId", "ClientId", "CampaignId"]],
              Metrics: [
                { Name: "SameDayBreachCount", Value: 3, Unit: "Count" },
              ],
            }),
          ],
        }),
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      3,
      { date: "2026-10-08", breachCount: "5" },
      "sameday breaches query completed",
    );
  });

  it("builds the query from the date component of the event date", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

    await createHandler(deps)({ date: "2026-10-08T15:30:00.000Z" });

    expect(runAthenaQuery).toHaveBeenCalledWith(
      deps,
      expect.objectContaining({
        executionParameters: ["2026-10-08T00:00:00.000Z"],
      }),
    );
  });

  it("returns failure when the event date is invalid", async () => {
    const deps = makeDeps();

    const result = await createHandler(deps)({ date: "not-a-date" });

    expect(runAthenaQuery).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ status: "FAILURE", breachCount: "0" }),
    );
  });

  it("returns a zero breach count when the query returns no rows", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(result).toEqual({ status: "SUCCESS", breachCount: "0" });
  });

  it("runs the sameday breaches query and returns failure", async () => {
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

  it("runs the sameday breaches query and returns failure when not an error", async () => {
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
