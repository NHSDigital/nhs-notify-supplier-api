import { randomUUID } from 'node:crypto';

export async function createValidRequestHeaders(): Promise<RequestHeaders> {
  let requestHeaders: RequestHeaders;
    requestHeaders = {
        headerauth1: process.env.HEADERAUTH || '',
        'NHSD-Supplier-ID': 'supplier-id',
        'NHSD-Correlation-ID': '1234',
    };
  return requestHeaders;
}

export async function createInvalidRequestHeaders(): Promise<RequestHeaders> {
  let requestHeaders: RequestHeaders;
    requestHeaders = {
        headerauth1: '',
        'NHSD-Supplier-ID': '70735ec9-3ba5-4fb0-bb01-b56d2df24bc',
        'NHSD-Correlation-ID': '1234',
    };
  return requestHeaders;
}

export async function createHeaderWithNoCorrelationId(): Promise<RequestHeaders> {
  let requestHeaders: RequestHeaders;
    requestHeaders = {
        headerauth1: process.env.HEADERAUTH || '',
        'NHSD-Supplier-ID': '70735ec9-3ba5-4fb0-bb01-b56d2df24bc',
        'NHSD-Correlation-ID': '',
    };
  return requestHeaders;
}

export const sandBoxHeader: RequestSandBoxHeaders = {
    'X-Request-ID': randomUUID(),
    'Content-Type': 'application/vnd.api+json',
    'X-Correlation-ID': randomUUID(),
};

export interface RequestHeaders {
  headerauth1: string;
  'NHSD-Supplier-ID': string;
  'NHSD-Correlation-ID': string;
  [key: string]: string;
}

export interface RequestSandBoxHeaders {
  'X-Request-ID': string;
  'Content-Type': string;
  'X-Correlation-ID': string;
  [key: string]: string;
}
