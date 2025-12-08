import { format } from "node:util";

export default class ApiError extends Error {
  readonly detail: string;

  constructor(
    detail: string,
    opts: { args?: unknown[]; cause?: unknown } = {},
  ) {
    const formatted = opts.args?.length ? format(detail, ...opts.args) : detail;
    super(formatted, opts.cause ? { cause: opts.cause } : undefined);
    this.detail = formatted;
  }
}
