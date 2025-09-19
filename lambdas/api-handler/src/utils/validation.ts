import * as errors from '../contracts/errors';
import { ValidationError } from '../errors';

export function assertNotEmpty<T>(
  value: T | null | undefined,
  detail: errors.ApiErrorDetail
): T {
  if (value == null) {
    throw new ValidationError(detail);
  }

  if (typeof value === "string" && value.trim() === "") {
    throw new ValidationError(detail);
  }

  return value;
}
