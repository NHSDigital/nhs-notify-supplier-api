import { runAthenaQuery } from "@internal/letter-sla-breaches-common";
import type { Deps } from "../handler/deps";
import createHandler from "../handler/populate-unallocated-breaches";

jest.mock("@internal/letter-sla-breaches-common");

const makeDeps = () =>
  ({
    logger: { info: jest.fn(), error: jest.fn() },
    env: {
      SUBSCRIPTION_TABLE_NAME: "subscription_events",
      PUBLICATION_TABLE_NAME: "publication_events",
    },
  }) as unknown as Deps;

describe("populateUnallocatedBreaches", () => {
  it("passes the subscription and publication tables to the query", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(runAthenaQuery).toHaveBeenCalledWith(
      deps,
      expect.objectContaining({
        queryString: expect.stringContaining("FROM subscription_events"),
        executionParameters: ["2026-10-08T00:00:00.000Z", "14"],
      }),
    );
    expect(runAthenaQuery).toHaveBeenCalledWith(
      deps,
      expect.objectContaining({
        queryString: expect.stringContaining("FROM publication_events"),
      }),
    );
    expect(result).toEqual({ status: "SUCCESS", breachCount: "0" });
  });

  it("logs an EMF metric per supplier, defaulting missing dimensions, and sums the total", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([
      {
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        breach_count: "2",
      },
      { supplierid: "supplier-b", clientid: "", breach_count: "3" },
      { supplierid: "supplier-c" },
      { breach_count: "0" },
    ]);

    const result = await createHandler(deps)({ date: "2026-10-08" });

    expect(result).toEqual({ status: "SUCCESS", breachCount: "5" });
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        logRef: "001-BREACH-COUNT-METRIC",
        description: "Unallocated breach count metric",
        SupplierId: "supplier-a",
        ClientId: "client-a",
        CampaignId: "campaign-a",
        UnallocatedBreachCount: 2,
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        logRef: "001-BREACH-COUNT-METRIC",
        description: "Unallocated breach count metric",
        SupplierId: "supplier-b",
        ClientId: "unknown",
        CampaignId: "unknown",
        UnallocatedBreachCount: 3,
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        logRef: "002-BREACH-TOTAL-METRIC",
        description: "Unallocated breach total metric",
        UnallocatedBreachTotal: 5,
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(6, {
      logRef: "003-QUERY-COMPLETED",
      description: "Unallocated breaches query completed",
      date: "2026-10-08",
      breachCount: "5",
    });
  });

  it.each([
    ["2026-10-08 15:30:00.000", "2026-10-08T15:30:00.000Z"],
    ["2026-10-08T15:30:00Z", "2026-10-08T15:30:00.000Z"],
  ])("parses event date %s as UTC", async (eventDate, expected) => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockResolvedValueOnce([]);

    await createHandler(deps)({ date: eventDate });

    expect(runAthenaQuery).toHaveBeenCalledWith(
      deps,
      expect.objectContaining({ executionParameters: [expected, "14"] }),
    );
  });

  it("logs and rethrows a query error", async () => {
    const deps = makeDeps();
    const error = new Error("boom");
    jest.mocked(runAthenaQuery).mockRejectedValueOnce(error);

    await expect(createHandler(deps)({ date: "2026-10-08" })).rejects.toBe(
      error,
    );
    expect(deps.logger.error).toHaveBeenCalledWith({
      logRef: "004-POPULATE-FAILED",
      description: "Failed to populate unallocated breaches",
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
      description: "Failed to populate unallocated breaches",
      date: "2026-10-08",
      error: "query failed",
    });
  });
});
