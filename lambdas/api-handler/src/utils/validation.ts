import * as errors from '../contracts/errors';
import { ValidationError } from '../errors';

export function assertNotEmpty(value: string | null | undefined, detail: errors.ApiErrorDetail): string {
  if (!value || value.trim() === '') {
    throw new ValidationError(detail);
  }
  return value;
}
