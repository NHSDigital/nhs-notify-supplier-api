export interface ApiError {
  id: string;
  code: ApiErrorCode;
  links: {about: 'https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier'};
  status: ApiErrorStatus;
  title: ApiErrorTitle;
  detail: ApiErrorDetail | string;
}

export enum ApiErrorCode {
  InternalServerError = 'NOTIFY_INTERNAL_SERVER_ERROR',
  InvalidRequest = 'NOTIFY_INVALID_REQUEST',
  NotFound = 'NOTIFY_LETTER_NOT_FOUND'
}

export enum ApiErrorTitle {
  InternalServerError = 'Internal server error',
  InvalidRequest = 'Invalid request',
  NotFound = 'Not found'
}

export enum ApiErrorStatus {
  InternalServerError = '500',
  InvalidRequest = '400',
  NotFound = '404'
}

export enum ApiErrorDetail {
  NotFoundLetterId = 'No resource found with that ID',
  InvalidRequestMissingBody = 'The request is missing the body',
  InvalidRequestMissingLetterIdPathParameter = 'The request is missing the letter id path parameter',
  InvalidRequestLetterIdsMismatch = 'The letter ID in the request body does not match the letter ID path parameter',
  InvalidRequestBody = 'The request body is invalid',
  InvalidRequestLimitNotANumber = 'The limit parameter is not a number',
  InvalidRequestLimitNotInRange = 'The limit parameter must be a positive number not greater than %s',
  InvalidRequestLimitOnly = "Only 'limit' query parameter is supported",
  InvalidRequestNoRequestId = 'The request does not contain a request id',
  InvalidRequestTimestamp = 'Timestamps should be UTC date/times in ISO8601 format, with a Z suffix',
  InvalidRequestLettersToUpdate = 'The request exceeds the maximum of %s items allowed for update'
}

export function buildApiError(params: {
  id: string
  code: ApiErrorCode;
  status: ApiErrorStatus;
  title: ApiErrorTitle;
  detail: ApiErrorDetail | string;
}): ApiError {
  return {
    id: params.id,
    code: params.code,
    links: { about: 'https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier' },
    status: params.status,
    title: params.title,
    detail: params.detail,
  };
}

export interface ErrorResponse {
  errors: ApiError[];
}
