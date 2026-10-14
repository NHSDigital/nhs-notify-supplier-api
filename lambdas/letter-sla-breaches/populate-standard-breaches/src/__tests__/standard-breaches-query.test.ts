import buildStandardBreachesQuery from "../handler/standard-breaches-query";

describe("buildStandardBreachesQuery", () => {
  it("selects from the event cache table filtered by the date partitions", () => {
    expect(
      buildStandardBreachesQuery("event_cache", new Date("2026-10-08"), 0),
    ).toEqual(
      expect.objectContaining({
        queryString: expect.stringContaining(
          "(_year = '2026' AND _month = '10' AND _day IN ('08'))",
        ),
        executionParameters: ["2026-10-08T00:00:00.000Z"],
      }),
    );
  });
});
