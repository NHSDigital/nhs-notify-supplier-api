import { z } from "zod";

const BankHolidaysSchema = z.object({
  "england-and-wales": z.object({
    events: z.array(
      z.object({
        date: z.coerce.date(),
      }),
    ),
  }),
});

export default async function fetchBankHolidays(url: string): Promise<Date[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const json = await response.json();
  return BankHolidaysSchema.parse(json)["england-and-wales"].events.map(
    (event) => event.date,
  );
}
