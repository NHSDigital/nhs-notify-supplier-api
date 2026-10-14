import buildStandardBreachesQuery from "../handler/standard-breaches-query";

describe("buildStandardBreachesQuery", () => {
  it("selects from the event cache table filtered by the date partitions", () => {
    expect(
      buildStandardBreachesQuery("event_cache", new Date("2026-10-08")),
    ).toEqual(
      expect.objectContaining({
        executionParameters: ["2026-10-08T00:00:00.000Z"],
      }),
    );
  });
});
