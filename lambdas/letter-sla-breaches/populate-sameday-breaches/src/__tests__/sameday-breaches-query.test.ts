import buildSamedayBreachesQuery from "../handler/sameday-breaches-query";

describe("buildSamedayBreachesQuery", () => {
  it("selects from the event cache table filtered by the date partitions", () => {
    expect(
      buildSamedayBreachesQuery("event_cache", new Date("2026-10-08"), 0),
    ).toEqual(
      expect.objectContaining({
        queryString: expect.stringContaining(
          "(_year = '2026' AND _month = '10' AND _day IN ('08'))",
        ),
        executionParameters: ["2026-10-08T00:00:00.000Z"],
      }),
    );
  });

  it("applies a 24 hour SLA to letters allocated at or after 16:00 UK time", () => {
    const { queryString } = buildSamedayBreachesQuery(
      "event_cache",
      new Date("2026-10-08"),
      0,
    );

    expect(queryString).toContain(
      "WHEN hour(min(event_time) AT TIME ZONE 'Europe/London') >= 16",
    );
    expect(queryString).toContain("THEN min(event_time) + INTERVAL '24' HOUR");
  });

  it("applies an end of day SLA to letters allocated before 16:00 UK time", () => {
    const { queryString } = buildSamedayBreachesQuery(
      "event_cache",
      new Date("2026-10-08"),
      0,
    );

    expect(queryString).toContain(
      "ELSE date_trunc('day', min(event_time) AT TIME ZONE 'Europe/London') + INTERVAL '1' DAY",
    );
  });

  it("returns the breach count per supplier as breach_count", () => {
    const { queryString } = buildSamedayBreachesQuery(
      "event_cache",
      new Date("2026-10-08"),
      0,
    );

    expect(queryString).toContain(
      "SELECT supplierid, count(*) AS breach_count",
    );
  });
});
