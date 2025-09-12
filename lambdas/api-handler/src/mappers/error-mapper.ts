import { APIGatewayProxyResult } from "aws-lambda";
import { NotFoundError, ValidationError } from "../errors";
import { buildApiError, ApiErrorCode, ApiErrorDetail, ApiErrorTitle, ApiError, ApiErrorStatus } from "../contracts/errors";

export interface ErrorResponse {
  errors: ApiError[];
}

export function mapErrorToResponse(error: unknown): APIGatewayProxyResult {
  if (error instanceof ValidationError) {
    return buildResponseFromErrorCode(ApiErrorCode.InvalidRequest, error.detail);
  } else if (error instanceof NotFoundError) {
    return buildResponseFromErrorCode(ApiErrorCode.NotFound, error.detail);
  } else if (error instanceof Error) {
    return buildResponseFromErrorCode(ApiErrorCode.InternalServerError, error.message);
  } else
  return buildResponseFromErrorCode(ApiErrorCode.InternalServerError, "Unexpected error");
}

function buildResponseFromErrorCode(code: ApiErrorCode, detail: ApiErrorDetail | string): APIGatewayProxyResult {
  const responseError = buildApiError({
    code,
    status: codeToStatus(code),
    title: codeToTitle(code),
    detail
  });
  return {
    statusCode: +responseError.status,
    body: JSON.stringify(buildErrorResponseFromError(responseError), null, 2)
  };
}

function codeToStatus(code: ApiErrorCode): ApiErrorStatus {
  switch(code) {
    case ApiErrorCode.InvalidRequest: return ApiErrorStatus.InvalidRequest;
    case ApiErrorCode.NotFound: return ApiErrorStatus.NotFound;
    default: return ApiErrorStatus.InternalServerError;
  }
}

function codeToTitle(code: ApiErrorCode): ApiErrorTitle {
  switch(code) {
    case ApiErrorCode.InvalidRequest: return ApiErrorTitle.InvalidRequest;
    case ApiErrorCode.NotFound: return ApiErrorTitle.NotFound;
    default: return ApiErrorTitle.InternalServerError;
  }
}

function buildErrorResponseFromError(error: ApiError): ErrorResponse {
  return { errors: [error] };
}
