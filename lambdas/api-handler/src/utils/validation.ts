import ValidationError from "../errors/validation-error";
import { ApiErrorDetail } from "../contracts/errors";
import { EnvVars } from "../config/env";

function normalisePrecision([
  _,
  mainPart,
  fractionalPart = ".000",
]: string[]): string {
  return fractionalPart.length < 4
    ? `${mainPart + fractionalPart + "0".repeat(4 - fractionalPart.length)}Z`
    : `${mainPart + fractionalPart.slice(0, 4)}Z`;
}

export function assertNotEmpty<T>(
  value: T | null | undefined,
  error: Error,
): T {
  if (value == null) {
    throw error;
  }

  if (typeof value === "string" && value.trim() === "") {
    throw error;
  }

  if (typeof value === "object" && Object.keys(value).length === 0) {
    throw error;
  }

  return value;
}

export function lowerCaseKeys(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]),
  );
}

export function validateIso8601Timestamp(timestamp: string) {
  const regex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(.\d+)?Z/;
  const groups = regex.exec(timestamp);
  if (!groups) {
    throw new ValidationError(ApiErrorDetail.InvalidRequestTimestamp);
  }
  const date = new Date(timestamp);
  // An invalid month (e.g. '2025-16-10T00:00:00Z') will result in new Date(timestamp).valueOf() returning NaN.
  // An invalid day of month (e.g. '2025-02-31T00:00:00Z') will roll over into the following month, but we can
  // detect that by comparing date.toISOString() with the original timestamp string. We need to normalise the
  // original string to millisecond precision to make this work.
  if (
    Number.isNaN(new Date(timestamp).valueOf()) ||
    date.toISOString() !== normalisePrecision(groups)
  ) {
    throw new ValidationError(ApiErrorDetail.InvalidRequestTimestamp);
  }
}

export function requireEnvVar<T extends keyof EnvVars>(
  envs: EnvVars,
  name: T,
): NonNullable<EnvVars[T]> {
  if (!(name in envs)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return envs[name] as NonNullable<EnvVars[T]>;
}
