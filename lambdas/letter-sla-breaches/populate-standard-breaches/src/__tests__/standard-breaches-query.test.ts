import buildStandardBreachesQuery from "../handler/standard-breaches-query";

describe("buildStandardBreachesQuery", () => {
  it("selects from the event cache table filtered by the date partitions", () => {
    expect(buildStandardBreachesQuery("event_cache", "2026-10-08")).toEqual({
      queryString:
        'SELECT * FROM "event_cache" WHERE partition_0 = ? AND partition_1 = ? AND partition_2 = ? LIMIT 100',
      executionParameters: ["'2026'", "'10'", "'08'"],
    });
  });

  it("escapes double quotes in the table name", () => {
    expect(
      buildStandardBreachesQuery('bad"table', "2026-10-08").queryString,
    ).toContain('FROM "bad""table"');
  });

  it.each(["", "2026-10-8", "08/10/2026", "2026-10-08' OR '1'='1"])(
    "rejects invalid date %p",
    (date) => {
      expect(() => buildStandardBreachesQuery("event_cache", date)).toThrow(
        `Invalid date "${date}", expected YYYY-MM-DD`,
      );
    },
  );
});
