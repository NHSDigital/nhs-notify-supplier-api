import { $BankHolidays, BankHolidays } from "../types";
import S3Cache from "./s3-cache";

async function fetchFromUrl(url: string, cutOffDate: Date) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const json = await response.json();
  const bankHolidays = $BankHolidays.parse(json);
  return {
    "england-and-wales": {
      events: bankHolidays["england-and-wales"].events.filter(
        (event) => event.date > cutOffDate.toISOString(),
      ),
    },
  };
}

export default async function fetchBankHolidays(
  url: string,
  s3Cache: S3Cache<BankHolidays>,
  cutOffDate: Date,
): Promise<string[]> {
  const fetchWithCaching = s3Cache.cacheJson(async () =>
    fetchFromUrl(url, cutOffDate),
  );
  const bankHolidays = await fetchWithCaching();
  return bankHolidays["england-and-wales"].events.map((event) => event.date);
}
