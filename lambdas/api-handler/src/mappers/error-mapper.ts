import { APIGatewayProxyResult } from "aws-lambda";
import { NotFoundError, ValidationError } from "../errors";
import { buildApiError, ApiErrorCode, ApiErrorDetail, ApiErrorTitle, ApiError, ApiErrorStatus } from "../contracts/errors";
import pino from "pino";
import { v4 as uuid } from 'uuid';

const logger = pino();
export interface ErrorResponse {
  errors: ApiError[];
}

export function mapErrorToResponse(error: unknown, correlationId: string | undefined): APIGatewayProxyResult {
  if (error instanceof ValidationError) {
    logger.info({ err: error }, `Validation error correlationId=${correlationId}`);
    return buildResponseFromErrorCode(ApiErrorCode.InvalidRequest, error.detail, correlationId);
  } else if (error instanceof NotFoundError) {
    logger.info({ err: error }, `Not found error correlationId=${correlationId}`);
    return buildResponseFromErrorCode(ApiErrorCode.NotFound, error.detail, correlationId);
  } else if (error instanceof Error) {
    logger.error({ err: error }, `Internal server error correlationId=${correlationId}`);
    return buildResponseFromErrorCode(ApiErrorCode.InternalServerError, error.message, correlationId);
  } else {
    logger.error({ err: error }, `Internal server error (non-Error thrown) correlationId=${correlationId}`);
    return buildResponseFromErrorCode(ApiErrorCode.InternalServerError, "Unexpected error", correlationId);
  }
}

function buildResponseFromErrorCode(code: ApiErrorCode, detail: string, correlationId: string | undefined): APIGatewayProxyResult {
  const id = correlationId ? correlationId : uuid();
  const responseError = buildApiError({
    id,
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
