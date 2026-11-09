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
        logRef: "001-BREACH-COUNT-METRIC",
        SupplierId: "supplier-a",
        ClientId: "client-a",
        CampaignId: "campaign-a",
        SamedayBreachCount: 2,
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            expect.objectContaining({
              Dimensions: [["SupplierId", "ClientId", "CampaignId"]],
              Metrics: [
                { Name: "SamedayBreachCount", Value: 2, Unit: "Count" },
              ],
            }),
          ],
        }),
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        logRef: "001-BREACH-COUNT-METRIC",
        SupplierId: "supplier-b",
        ClientId: "client-b",
        CampaignId: "campaign-b",
        SamedayBreachCount: 3,
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            expect.objectContaining({
              Dimensions: [["SupplierId", "ClientId", "CampaignId"]],
              Metrics: [
                { Name: "SamedayBreachCount", Value: 3, Unit: "Count" },
              ],
            }),
          ],
        }),
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        logRef: "002-BREACH-TOTAL-METRIC",
        SamedayBreachTotal: 5,
        _aws: expect.objectContaining({
          CloudWatchMetrics: [
            expect.objectContaining({
              Dimensions: [[]],
              Metrics: [
                { Name: "SamedayBreachTotal", Value: 5, Unit: "Count" },
              ],
            }),
          ],
        }),
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(4, {
      logRef: "003-QUERY-COMPLETED",
      description: "Sameday breaches query completed",
      date: "2026-10-08",
      breachCount: "5",
    });
  });

  it("publishes a zero breach total when there are no breaches", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

    await createHandler(deps)({ date: "2026-10-08" });

    expect(deps.logger.info).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ SamedayBreachTotal: 0 }),
    );
  });

  it("defaults missing EMF dimension values so the metric is still published", async () => {
    const deps = makeDeps();
    jest
      .mocked(runAthenaQuery)
      .mockResolvedValueOnce([
        { supplierid: "supplier-a", clientid: "", breach_count: "4" },
      ]);

    await createHandler(deps)({ date: "2026-10-08" });

    expect(deps.logger.info).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        SupplierId: "supplier-a",
        ClientId: "unknown",
        CampaignId: "unknown",
        SamedayBreachCount: 4,
      }),
    );
  });

  it.each([
    ["2026-10-08", "2026-10-08T00:00:00.000Z"],
    ["2026-10-08T15:30:00.000Z", "2026-10-08T15:30:00.000Z"],
    ["2026-10-08T15:30:00Z", "2026-10-08T15:30:00.000Z"],
  ])(
    "parses supported event date %s as UTC",
    async (eventDate, expectedDate) => {
      const deps = makeDeps();
      jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

      await createHandler(deps)({ date: eventDate });

      expect(runAthenaQuery).toHaveBeenCalledWith(
        deps,
        expect.objectContaining({
          executionParameters: [expectedDate],
        }),
      );
    },
  );

  it("throws when the event date is invalid", async () => {
    const deps = makeDeps();

    await expect(createHandler(deps)({ date: "not-a-date" })).rejects.toThrow(
      "Invalid event date: not-a-date",
    );

    expect(runAthenaQuery).not.toHaveBeenCalled();
  });

  it("returns a zero breach count when the query returns no rows", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(result).toEqual({ status: "SUCCESS", breachCount: "0" });
  });

  it("logs and rethrows a query error", async () => {
    const deps = makeDeps();
    const error = new Error("boom");
    jest.mocked(runAthenaQuery).mockRejectedValueOnce(error);

    await expect(createHandler(deps)({ date: "2026-10-08" })).rejects.toBe(
      error,
    );

    expect(runAthenaQuery).toHaveBeenCalled();
    expect(deps.logger.error).toHaveBeenCalledWith({
      logRef: "004-POPULATE-FAILED",
      description: "Failed to populate sameday breaches",
      date: "2026-10-08",
      error,
    });
  });

  it("logs and rethrows a non-Error query failure", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockRejectedValueOnce("query failed");

    await expect(createHandler(deps)({ date: "2026-10-08" })).rejects.toBe(
      "query failed",
    );

    expect(deps.logger.error).toHaveBeenCalledWith({
      logRef: "004-POPULATE-FAILED",
      description: "Failed to populate sameday breaches",
      date: "2026-10-08",
      error: "query failed",
    });
  });
});
