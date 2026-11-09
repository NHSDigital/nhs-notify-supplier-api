import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
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
        SupplierId: "supplier-a",
        ClientId: "client-a",
        CampaignId: "campaign-a",
        UnallocatedBreachCount: 2,
      }),
    );
    expect(deps.logger.info).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        SupplierId: "supplier-b",
        ClientId: "unknown",
        CampaignId: "unknown",
        UnallocatedBreachCount: 3,
      }),
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ UnallocatedBreachTotal: 5 }),
    );
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

  it("returns a failure result when the query errors", async () => {
    const deps = makeDeps();
    jest.mocked(runAthenaQuery).mockRejectedValueOnce(new Error("boom"));
    jest.mocked(runAthenaQuery).mockRejectedValueOnce("not an error");

    await expect(createHandler(deps)({ date: "2026-10-08" })).resolves.toEqual({
      status: "FAILURE",
      failureReason: "boom",
      breachCount: "0",
    });
    await expect(createHandler(deps)({ date: "2026-10-08" })).resolves.toEqual({
      status: "FAILURE",
      failureReason: "not an error",
      breachCount: "0",
    });
    expect(deps.logger.error).toHaveBeenCalledTimes(2);
  });
});
