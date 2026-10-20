const LogRefs = {
  HEALTHCHECK_PASSED: {
    code: "001-HEALTHCHECK",
    description: "Healthcheck passed",
  },
  UNEXPECTED_QUERY_PARAMETERS: {
    code: "002-UNEXPECTED-PARAMS",
    description: "Unexpected query parameter(s) present",
  },
  LIMIT_NOT_NUMBER: {
    code: "003-NOT-NUMBER",
    description: "limit parameter is not a number",
  },
  LIMIT_INVALID: {
    code: "004-LIMIT-INVALID",
    description: "Limit value is invalid",
  },
  PENDING_LETTERS_FETCHED: {
    code: "005-PENDING-FETCHED",
    description: "Pending letters successfully fetched",
  },
  LETTER_FETCHED: {
    code: "006-LETTER-FETCHED",
    description: "Letter successfully fetched by id",
  },
  PRESIGNED_URL_GENERATED: {
    code: "007-URL-GENERATED",
    description: "Generated presigned URL",
  },
  PATCH_LETTER_RECEIVED: {
    code: "008-PATCH-LETTER",
    description: "Received patch letter request",
  },
  POST_LETTERS_RECEIVED: {
    code: "009-POST-LETTERS",
    description: "Received post letters request",
  },
  ENQUEUED_LETTER_UPDATES: {
    code: "010-UPDATES-QUEUED",
    description: "Enqueued letter updates",
  },
  SOME_BATCH_ENTRIES_FAILED: {
    code: "011-BATCH-FAILED",
    description: "Some batch entries failed",
  },
  ERROR_ENQUEUING_LETTER_STATUS_UPDATES: {
    code: "012-ENQUEUE-ERROR",
    description: "Error enqueuing letter status updates",
  },
  LETTER_STATUS_UPDATE_SENT: {
    code: "013-STATUS-SENT",
    description: "Sent letter status update via topic",
  },
  LETTER_STATUS_UPDATE_ERROR: {
    code: "014-STATUS-ERROR",
    description: "Error processing letter status update",
  },
  MI_RETRIEVED: {
    code: "015-MI-RETRIEVED",
    description: "Retrieved management information",
  },
  MI_POSTED: {
    code: "016-MI-POSTED",
    description: "Posted management information",
  },
  VALIDATION_ERROR: {
    code: "017-VALIDATION-ERROR",
    description: "Validation error",
  },
  NOT_FOUND_ERROR: {
    code: "018-NOT-FOUND-ERROR",
    description: "Not found error",
  },
  INTERNAL_SERVER_ERROR: {
    code: "019-SERVER-ERROR",
    description: "Internal server error",
  },
  INTERNAL_SERVER_ERROR_NON_ERROR: {
    code: "020-SERVER-ERROR-NON-ERROR",
    description: "Internal server error (non-Error thrown)",
  },
  STATUS_ENDPOINT_ERROR: {
    code: "021-ENDPOINT-ERROR",
    description: "Status endpoint error, services not available",
  },
  METRIC: {
    code: "022-METRIC",
    description: "Metric emitted",
  },
  ERR_METRIC: {
    code: "023-ERR-METRIC",
    description: "Error metric emitted",
  },
};

export default LogRefs;
