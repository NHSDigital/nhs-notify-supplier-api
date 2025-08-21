import { ApiErrorDetail } from "../contracts/errors";

export class NotFoundError extends Error {
  detail: ApiErrorDetail;
  constructor(detail: ApiErrorDetail) {
    super(detail);
    this.detail = detail;
  }
}

export class ValidationError extends Error {
  detail: ApiErrorDetail;
  constructor(detail: ApiErrorDetail) {
    super(detail);
    this.detail = detail;
  }
}
