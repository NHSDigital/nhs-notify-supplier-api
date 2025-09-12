import { ApiErrorDetail } from "../contracts/errors";

class ApiError extends Error {
  detail: ApiErrorDetail;
  constructor(detail: ApiErrorDetail, message?: string, cause?: Error) {
    super(message ?? detail, { cause });
    this.detail = detail;
  }
}

export class NotFoundError extends ApiError {}

export class ValidationError extends ApiError {}
