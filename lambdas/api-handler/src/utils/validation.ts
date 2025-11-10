import { APIGatewayProxyEventHeaders } from 'aws-lambda';
import { ValidationError } from '../errors';
import { ApiErrorDetail } from '../contracts/errors';
import { Deps } from '../config/deps';
import { EnvVars } from '../config/env';

export function assertNotEmpty<T>(
  value: T | null | undefined,
  error: Error
): T {
  if (value == null) {
    throw error;
  }

  if (typeof value === 'string' && value.trim() === '') {
    throw error;
  }

  if (typeof value === 'object' && Object.keys(value).length === 0) {
    throw error;
  }

  return value;
}

export function lowerCaseKeys(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
}

export function validateCommonHeaders(headers: APIGatewayProxyEventHeaders, deps: Deps
): { ok: true; value: {correlationId: string, supplierId: string } } | { ok: false; error: Error; correlationId?: string } {

  if (!headers || Object.keys(headers).length === 0) {
    return { ok: false, error: new Error('The request headers are empty') };
  }

  const lowerCasedHeaders = lowerCaseKeys(headers);

  const correlationId = lowerCasedHeaders[deps.env.APIM_CORRELATION_HEADER];
  if (!correlationId) {
    return { ok: false, error: new Error("The request headers don't contain the APIM correlation id") };
  }

  const requestId = lowerCasedHeaders['x-request-id'];
  if (!requestId) {
    return {
      ok: false,
      error: new Error("The request headers don't contain the x-request-id"),
      correlationId
    };
  }

  const supplierId = lowerCasedHeaders[deps.env.SUPPLIER_ID_HEADER];
  if (!supplierId) {
    return {
      ok: false,
      error: new Error('The supplier ID is missing from the request'),
      correlationId
    };
  }

  return { ok: true, value: { correlationId, supplierId } };
}

export function validateIso8601Timestamp(timestamp: string) {

  function normalisePrecision([_, mainPart, fractionalPart='.000']: string[]) : string {
    if (fractionalPart.length < 4) {
      return mainPart + fractionalPart + '0'.repeat(4 - fractionalPart.length) + 'Z';
    } else {
      return mainPart + fractionalPart.slice(0, 4) + 'Z';
    }
  }

  const groups = timestamp.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(.\d+)?Z/);
  if (!groups)  {
    throw new ValidationError(ApiErrorDetail.InvalidRequestTimestamp);
  }
  const date = new Date(timestamp);
  // An invalid month (e.g. '2025-16-10T00:00:00Z') will result in new Date(timestamp).valueOf() returning NaN.
  // An invalid day of month (e.g. '2025-02-31T00:00:00Z') will roll over into the following month, but we can
  // detect that by comparing date.toISOString() with the original timestamp string. We need to normalise the
  // original string to millisecond precision to make this work.
  if (Number.isNaN(new Date(timestamp).valueOf()) || date.toISOString() != normalisePrecision(groups)) {
      throw new ValidationError(ApiErrorDetail.InvalidRequestTimestamp);
  }
}

export function requireEnvVar<T extends keyof EnvVars>(
  envs: EnvVars,
  name: T
): NonNullable<EnvVars[T]> {
  const value = envs[name];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value as NonNullable<EnvVars[T]>;
}
