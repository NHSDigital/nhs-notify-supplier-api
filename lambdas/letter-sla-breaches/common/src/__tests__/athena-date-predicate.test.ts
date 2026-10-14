import buildAthenaDatePredicate from "../athena-date-predicate";

describe("buildAthenaDatePredicate", () => {
  it("includes only the requested UTC date when no days are subtracted", () => {
    expect(
      buildAthenaDatePredicate(new Date("2026-10-14T23:59:59.999Z"), 0),
    ).toBe("(_year = '2026' AND _month = '10' AND _day IN ('14'))");
  });

  it("groups consecutive dates in the same month into one partition predicate", () => {
    expect(
      buildAthenaDatePredicate(new Date("2026-10-14T12:00:00.000Z"), 2),
    ).toBe("(_year = '2026' AND _month = '10' AND _day IN ('12', '13', '14'))");
  });

  it("creates separate predicates when the date range crosses a month", () => {
    expect(
      buildAthenaDatePredicate(new Date("2026-11-01T00:00:00.000Z"), 2),
    ).toBe(
      "(_year = '2026' AND _month = '10' AND _day IN ('30', '31'))\n" +
        "   OR (_year = '2026' AND _month = '11' AND _day IN ('01'))",
    );
  });

  it("creates separate predicates when the date range crosses a year", () => {
    expect(
      buildAthenaDatePredicate(new Date("2026-01-01T00:00:00.000Z"), 1),
    ).toBe(
      "(_year = '2025' AND _month = '12' AND _day IN ('31'))\n" +
        "   OR (_year = '2026' AND _month = '01' AND _day IN ('01'))",
    );
  });

  it("includes leap days in the date range", () => {
    expect(
      buildAthenaDatePredicate(new Date("2024-03-01T00:00:00.000Z"), 2),
    ).toBe(
      "(_year = '2024' AND _month = '02' AND _day IN ('28', '29'))\n" +
        "   OR (_year = '2024' AND _month = '03' AND _day IN ('01'))",
    );
  });

  it("uses UTC calendar dates regardless of the time component", () => {
    expect(
      buildAthenaDatePredicate(new Date("2026-10-14T00:30:00+02:00"), 1),
    ).toBe("(_year = '2026' AND _month = '10' AND _day IN ('12', '13'))");
  });

  it("throws when given an invalid date", () => {
    expect(() => buildAthenaDatePredicate(new Date(Number.NaN), 0)).toThrow(
      new RangeError("date must be valid"),
    );
  });

  it.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])(
    "throws when daysToSubtract is not a non-negative safe integer (%s)",
    (daysToSubtract) => {
      expect(() =>
        buildAthenaDatePredicate(
          new Date("2026-10-14T00:00:00.000Z"),
          daysToSubtract,
        ),
      ).toThrow(
        new RangeError("daysToSubtract must be a non-negative integer"),
      );
    },
  );
});
