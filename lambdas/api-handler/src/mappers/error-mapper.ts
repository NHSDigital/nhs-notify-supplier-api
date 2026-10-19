import { APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { Logger } from "pino";
import NotFoundError from "../errors/not-found-error";
import ValidationError from "../errors/validation-error";
import {
  ApiError,
  ApiErrorCode,
  ApiErrorStatus,
  ApiErrorTitle,
  ErrorResponse,
  buildApiError,
} from "../contracts/errors";
import LogRefs from "../config/log-references";

function codeToTitle(code: ApiErrorCode): ApiErrorTitle {
  switch (code) {
    case ApiErrorCode.InvalidRequest: {
      return ApiErrorTitle.InvalidRequest;
    }
    case ApiErrorCode.NotFound: {
      return ApiErrorTitle.NotFound;
    }
    default: {
      return ApiErrorTitle.InternalServerError;
    }
  }
}

function codeToStatus(code: ApiErrorCode): ApiErrorStatus {
  switch (code) {
    case ApiErrorCode.InvalidRequest: {
      return ApiErrorStatus.InvalidRequest;
    }
    case ApiErrorCode.NotFound: {
      return ApiErrorStatus.NotFound;
    }
    default: {
      return ApiErrorStatus.InternalServerError;
    }
  }
}

function buildErrorResponseFromError(error: ApiError): ErrorResponse {
  return { errors: [error] };
}

function mapToErrorResponse(apiError: ApiError) {
  return {
    statusCode: +apiError.status,
    body: JSON.stringify(buildErrorResponseFromError(apiError), null, 2),
  };
}

function mapToApiError(
  code: ApiErrorCode,
  detail: string,
  correlationId: string | undefined,
): ApiError {
  const id = correlationId || randomUUID();
  return buildApiError({
    id,
    code,
    status: codeToStatus(code),
    title: codeToTitle(code),
    detail,
  });
}

export function logAndMapToApiError(
  error: unknown,
  correlationId: string | undefined,
  logger: Logger,
): ApiError {
  if (error instanceof ValidationError) {
    logger.info({
      logRef: LogRefs.VALIDATION_ERROR.code,
      description: LogRefs.VALIDATION_ERROR.description,
      err: error,
      correlationId,
    });
    return mapToApiError(
      ApiErrorCode.InvalidRequest,
      error.detail,
      correlationId,
    );
  }
  if (error instanceof NotFoundError) {
    logger.info({
      logRef: LogRefs.NOT_FOUND_ERROR.code,
      description: LogRefs.NOT_FOUND_ERROR.description,
      err: error,
      correlationId,
    });
    return mapToApiError(ApiErrorCode.NotFound, error.detail, correlationId);
  }
  if (error instanceof Error) {
    logger.error({
      logRef: LogRefs.INTERNAL_SERVER_ERROR.code,
      description: LogRefs.INTERNAL_SERVER_ERROR.description,
      err: error,
      correlationId,
    });
    return mapToApiError(
      ApiErrorCode.InternalServerError,
      "Unexpected error",
      correlationId,
    );
  }
  logger.error({
    logRef: LogRefs.INTERNAL_SERVER_ERROR_NON_ERROR.code,
    description: LogRefs.INTERNAL_SERVER_ERROR_NON_ERROR.description,
    correlationId,
  });
  return mapToApiError(
    ApiErrorCode.InternalServerError,
    "Unexpected error",
    correlationId,
  );
}

export function processError(
  error: unknown,
  correlationId: string | undefined,
  logger: Logger,
): APIGatewayProxyResult {
  return mapToErrorResponse(logAndMapToApiError(error, correlationId, logger));
}
