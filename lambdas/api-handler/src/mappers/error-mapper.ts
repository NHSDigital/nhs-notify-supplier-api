import { APIGatewayProxyResult } from "aws-lambda";
import { NotFoundError, ValidationError } from "../errors";
import { buildApiError, ApiErrorCode, ApiErrorTitle, ApiError, ApiErrorStatus, ErrorResponse } from "../contracts/errors";
import { v4 as uuid } from 'uuid';
import { Logger } from "pino";

export function processError(error: unknown, correlationId: string | undefined, logger: Logger): APIGatewayProxyResult
{
  return mapToErrorResponse(logAndMapToApiError(error, correlationId, logger));
}

export function logAndMapToApiError(error: unknown, correlationId: string | undefined, logger: Logger): ApiError {
  if (error instanceof ValidationError) {
    logger.info({ err: error }, `Validation error correlationId=${correlationId}`);
    return mapToApiError(ApiErrorCode.InvalidRequest, error.detail, correlationId);
  } else if (error instanceof NotFoundError) {
    logger.info({ err: error }, `Not found error correlationId=${correlationId}`);
    return mapToApiError(ApiErrorCode.NotFound, error.detail, correlationId);
  } else if (error instanceof Error) {
    logger.error({ err: error }, `Internal server error correlationId=${correlationId}`);
    return mapToApiError(ApiErrorCode.InternalServerError, "Unexpected error", correlationId);
  } else {
    logger.error({ err: error }, `Internal server error (non-Error thrown) correlationId=${correlationId}`);
    return mapToApiError(ApiErrorCode.InternalServerError, "Unexpected error", correlationId);
  }
}

function mapToErrorResponse(apiError: ApiError)
{
  return {
    statusCode: +apiError.status,
    body: JSON.stringify(buildErrorResponseFromError(apiError), null, 2)
  };
}

function mapToApiError(code: ApiErrorCode, detail: string, correlationId: string | undefined): ApiError {
  const id = correlationId ? correlationId : uuid();
  return buildApiError({
    id,
    code,
    status: codeToStatus(code),
    title: codeToTitle(code),
    detail
  });
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
