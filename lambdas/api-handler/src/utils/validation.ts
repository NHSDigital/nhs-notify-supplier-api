import { APIGatewayProxyEventHeaders } from 'aws-lambda';
import { ValidationError } from '../errors';
import { ApiErrorDetail } from '../contracts/errors';
import { Deps } from '../config/deps';

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
