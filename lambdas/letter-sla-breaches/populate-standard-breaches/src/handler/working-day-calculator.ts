import { format, subDays } from "date-fns";

export default function subtractWorkingDays(
  today: Date,
  daysToSubtract: number,
  bankHolidays: string[],
): Date {
  if (daysToSubtract === 0) {
    return today;
  }
  return previousDays(today)
    .filter((day) => isWorkingDay(day, bankHolidays))
    .drop(daysToSubtract - 1)
    .next().value!;
}

function* previousDays(today: Date) {
  let day = today;
  while (true) {
    day = subDays(day, 1);
    yield day;
  }
}
function isWorkingDay(date: Date, bankHolidays: string[]) {
  return (
    date.getDay() !== 0 &&
    date.getDay() !== 6 &&
    !bankHolidays.includes(format(date, "yyyy-MM-dd"))
  );
}
