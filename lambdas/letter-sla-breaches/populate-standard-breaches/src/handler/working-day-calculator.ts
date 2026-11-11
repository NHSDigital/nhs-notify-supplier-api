import { format, subDays } from "date-fns";

export default function subtractWorkingDays(
  today: Date,
  daysToSubtract: number,
  bankHolidays: string[],
): Date {
  if (daysToSubtract === 0) {
    return today;
  }
  if (daysToSubtract < 0) {
    throw new RangeError("daysToSubtract must not be negative");
  }

  let day = today;
  let remaining = daysToSubtract;
  while (remaining > 0) {
    day = subDays(day, 1);
    if (isWorkingDay(day, bankHolidays)) {
      remaining -= 1;
    }
  }
  return day;
}

function isWorkingDay(date: Date, bankHolidays: string[]) {
  return (
    date.getDay() !== 0 &&
    date.getDay() !== 6 &&
    !bankHolidays.includes(format(date, "yyyy-MM-dd"))
  );
}
