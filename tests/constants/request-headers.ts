/* eslint-disable prefer-const */
import { randomUUID } from "node:crypto";
import { SUPPLIERID } from "./api-constants";

export const sandBoxHeader: RequestSandBoxHeaders = {
  "X-Request-ID": randomUUID(),
  "NHSD-Supplier-ID": SUPPLIERID,
  "Content-Type": "application/vnd.api+json",
  "X-Correlation-ID": randomUUID(),
};

export interface RequestHeaders {
  "NHSD-Supplier-ID": string;
  "NHSD-Correlation-ID": string;
  [key: string]: string;
}

export interface RequestSandBoxHeaders {
  "X-Request-ID": string;
  "Content-Type": string;
  "X-Correlation-ID": string;
  [key: string]: string;
}

export function createInvalidRequestHeaders(): RequestHeaders {
  let requestHeaders: RequestHeaders;
  requestHeaders = {
    "NHSD-Supplier-ID": "NoSupplier",
    "NHSD-Correlation-ID": "1234",
    "X-Request-ID": "requestId1",
  };
  return requestHeaders;
}

export function createHeaderWithNoCorrelationId(): RequestHeaders {
  let requestHeaders: RequestHeaders;
  requestHeaders = {
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "",
    "X-Request-ID": "requestId1",
  };
  return requestHeaders;
}

export function createValidRequestHeaders(): RequestHeaders {
  let requestHeaders: RequestHeaders;
  requestHeaders = {
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "12345",
    "X-Request-ID": "requestId1",
  };
  return requestHeaders;
}

export function createHeaderWithNoRequestId(): RequestHeaders {
  let requestHeaders: RequestHeaders;
  requestHeaders = {
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "1234",
    "X-Request-ID": "",
  };
  return requestHeaders;
}
