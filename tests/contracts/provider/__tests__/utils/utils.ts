import path from "node:path";
import fs from "node:fs";

export const LETTER_STATUSES = [
  "ACCEPTED",
  "CANCELLED",
  "DELIVERED",
  "DISPATCHED",
  "ENCLOSED",
  "FAILED",
  "FORWARDED",
  "PENDING",
  "PRINTED",
  "REJECTED",
  "RETURNED",
] as const;

type LetterStatus = (typeof LETTER_STATUSES)[number];

export function getExampleEvent(status: LetterStatus): unknown {
  const examplePath = path.join(
    __dirname,
    "../../../../../internal/events/schemas/examples",
    `letter.${status}.json`,
  );

  const content = fs.readFileSync(examplePath, "utf8");
  return JSON.parse(content);
}

export function getMessageProviderForStatus(
  status: LetterStatus,
): Record<string, () => Promise<unknown>> {
  return {
    [`letter-${status.toLowerCase()}`]: async () => getExampleEvent(status),
  };
}

export function getPactUrlForStatus(
  consumerPackage: string,
  status: LetterStatus,
): string {
  return path.join(
    __dirname,
    "../../",
    ".contracts",
    consumerPackage,
    "pacts",
    "supplier-api",
    `core-letter-${status.toLowerCase()}.json`,
  );
}

export function getAllLetterStatuses(): readonly LetterStatus[] {
  return LETTER_STATUSES;
}
