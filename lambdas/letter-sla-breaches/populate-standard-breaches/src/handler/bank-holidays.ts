import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { z } from "zod";
import { type Deps } from "./deps";

export const BANK_HOLIDAY_CACHE_KEY = "bank_holiday_cache/bank-holidays.json";

const BankHolidaysSchema = z.object({
  "england-and-wales": z.object({
    events: z.array(
      z.object({
        date: z.coerce.date(),
      }),
    ),
  }),
});

type BankHolidays = z.infer<typeof BankHolidaysSchema>;

const extractDates = (bankHolidays: BankHolidays): Date[] =>
  bankHolidays["england-and-wales"].events.map((event) => event.date);

async function fetchFromSource(deps: Deps): Promise<BankHolidays> {
  const response = await fetch(deps.env.BANK_HOLIDAY_JSON_URL);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const json: unknown = await response.json();
  const bankHolidays = BankHolidaysSchema.parse(json);
  await writeCache(deps, json);
  return bankHolidays;
}

async function writeCache(deps: Deps, json: unknown): Promise<void> {
  try {
    await deps.s3Client.send(
      new PutObjectCommand({
        Bucket: deps.env.BANK_HOLIDAY_CACHE_BUCKET_NAME,
        Key: BANK_HOLIDAY_CACHE_KEY,
        Body: JSON.stringify(json),
        ContentType: "application/json",
      }),
    );
  } catch (error) {
    // A failure to cache shouldn't prevent the freshly fetched data being used
    deps.logger.warn({
      err: error,
      description: "Failed to cache bank holidays in S3",
    });
  }
}

async function readCache(deps: Deps): Promise<BankHolidays | undefined> {
  try {
    const response = await deps.s3Client.send(
      new GetObjectCommand({
        Bucket: deps.env.BANK_HOLIDAY_CACHE_BUCKET_NAME,
        Key: BANK_HOLIDAY_CACHE_KEY,
      }),
    );
    const body = await response.Body?.transformToString();
    if (!body) {
      return undefined;
    }
    return BankHolidaysSchema.parse(JSON.parse(body));
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return undefined;
    }
    throw error;
  }
}

export default async function fetchBankHolidays(deps: Deps): Promise<Date[]> {
  let bankHolidays: BankHolidays | undefined;
  try {
    bankHolidays = await fetchFromSource(deps);
  } catch (fetchError) {
    deps.logger.warn({
      err: fetchError,
      description:
        "Failed to fetch bank holidays, falling back to cached value",
    });
    bankHolidays = await readCache(deps);
    if (!bankHolidays) {
      throw new Error(
        "Failed to fetch bank holidays and no cached value is available",
        { cause: fetchError },
      );
    }
  }

  return extractDates(bankHolidays);
}
