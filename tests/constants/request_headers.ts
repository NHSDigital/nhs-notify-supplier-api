import { randomUUID } from 'node:crypto';
import { supplierId } from './api_constants';

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

export async function createInvalidRequestHeaders(): Promise<RequestHeaders> {
  let requestHeaders: RequestHeaders;
    requestHeaders = {
        headerauth1: '',
        'NHSD-Supplier-ID': supplierId,
        'NHSD-Correlation-ID': '1234',
        'X-Request-ID': 'requestId1'
    };
  return requestHeaders;
}

export async function createHeaderWithNoCorrelationId(): Promise<RequestHeaders> {
  let requestHeaders: RequestHeaders;
    requestHeaders = {
        headerauth1: process.env.HEADERAUTH || '',
        'NHSD-Supplier-ID': supplierId,
        'NHSD-Correlation-ID': '',
        'X-Request-ID': 'requestId1'
    };
  return requestHeaders;
}

export async function createValidRequestHeaders(): Promise<RequestHeaders> {
  let requestHeaders: RequestHeaders;
    requestHeaders = {
        headerauth1: process.env.HEADERAUTH || '',
        'NHSD-Supplier-ID': supplierId,
        'NHSD-Correlation-ID': '12345',
        'X-Request-ID': 'requestId1'
    };
  return requestHeaders;
}
