import { z } from "zod";
import S3Cache from "./s3-cache";

const BankHolidaysSchema = z.object({
  "england-and-wales": z.object({
    events: z.array(
      z.object({
        date: z.iso.date(),
      }),
    ),
  }),
});

async function fetchFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const json = await response.json();
  return json;
}

export default async function fetchBankHolidays(
  url: string,
  s3Cache: S3Cache,
): Promise<string[]> {
  const fetchWithCaching = s3Cache.cacheJson(async () => fetchFromUrl(url));
  const json = await fetchWithCaching();
  return BankHolidaysSchema.parse(json)["england-and-wales"].events.map(
    (event) => event.date,
  );
}
