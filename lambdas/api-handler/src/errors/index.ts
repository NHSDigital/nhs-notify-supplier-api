import util from "util";

class ApiError extends Error {
  readonly detail: string;

  constructor(detail: string, opts: { args?: unknown[]; cause?: unknown } = {}) {
    const formatted = opts.args?.length ? util.format(detail, ...(opts.args)) : detail;
    super(formatted, opts.cause ? { cause: opts.cause } : undefined);
    this.detail = formatted;
  }
}

export class NotFoundError extends ApiError {}

export class ValidationError extends ApiError {}
