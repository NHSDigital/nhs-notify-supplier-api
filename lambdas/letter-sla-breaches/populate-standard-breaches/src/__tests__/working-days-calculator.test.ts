import { TZDate } from "@date-fns/tz";
import subtractWorkingDays from "../handler/working-day-calculator";

function atZoneEuropeLondon(date: string) {
  const [year, month, day] = date.split(/-/).map(Number);
  return new TZDate(year, month - 1, day, "Europe/London");
}

describe("working-days-calculator", () => {
  describe("subtract-working-days", () => {
    it.each([
      ["2026-10-29", 0, "2026-10-29"],
      ["2026-10-29", 1, "2026-10-28"],
      ["2026-10-29", 5, "2026-10-22"],
      ["2026-10-29", 15, "2026-10-08"],
      ["2026-11-02", 1, "2026-10-30"],
      ["2026-11-01", 1, "2026-10-30"],
      ["2026-10-31", 1, "2026-10-30"],
    ])(
      "subtracts working days",
      (today: string, daysToSubtract: number, expectedResult: string) => {
        const result = subtractWorkingDays(
          atZoneEuropeLondon(today),
          daysToSubtract,
          [],
        );
        expect(result.getTime()).toBe(
          atZoneEuropeLondon(expectedResult).getTime(),
        );
      },
    );

    it("errors on negative input", () => {
      expect(() => {
        subtractWorkingDays(atZoneEuropeLondon("2026-10-29"), -1, []);
      }).toThrow();
    });

    it("takes bank holidays into effect", () => {
      const result = subtractWorkingDays(atZoneEuropeLondon("2026-04-07"), 2, [
        "2026-04-06",
        "2026-04-03",
      ]);
      expect(result.getTime()).toBe(atZoneEuropeLondon("2026-04-01").getTime());
    });
  });
});
