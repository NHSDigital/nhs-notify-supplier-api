export default function buildAthenaDatePredicate(
  date: Date,
  daysToSubtract: number,
): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("date must be valid");
  }

  if (!Number.isSafeInteger(daysToSubtract) || daysToSubtract < 0) {
    throw new RangeError("daysToSubtract must be a non-negative integer");
  }

  const endDate = new Date(date);
  endDate.setUTCHours(0, 0, 0, 0);

  const currentDate = new Date(endDate);
  currentDate.setUTCDate(currentDate.getUTCDate() - daysToSubtract);

  const groups: { year: string; month: string; days: string[] }[] = [];

  while (currentDate <= endDate) {
    const year = String(currentDate.getUTCFullYear()).padStart(4, "0");
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getUTCDate()).padStart(2, "0");
    const lastGroup = groups.at(-1);

    if (lastGroup?.year === year && lastGroup.month === month) {
      lastGroup.days.push(day);
    } else {
      groups.push({ year, month, days: [day] });
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return groups
    .map(
      // eslint-disable-next-line sort-destructure-keys/sort-destructure-keys
      ({ year, month, days }) =>
        `(_year = '${year}' AND _month = '${month}' AND _day IN (${days
          .map((day) => `'${day}'`)
          .join(", ")}))`,
    )
    .join("\n   OR ");
}
