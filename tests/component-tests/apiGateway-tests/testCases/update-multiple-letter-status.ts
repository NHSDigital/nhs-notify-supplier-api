import { RequestHeaders } from "../../../constants/request-headers";
import { SUPPLIERID } from "../../../constants/api-constants";
import {
  ErrorMessageBody,
  PostMessageRequestBody,
} from "../../../helpers/common-types";
import { SupplierApiLetters } from "../../../helpers/generate-fetch-test-data";

export function postLettersRequestHeaders(): RequestHeaders {
  let requestHeaders: RequestHeaders;
  requestHeaders = {
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "12344",
    "X-Request-ID": "requestId1",
  };
  return requestHeaders;
}

export function postLettersInvalidRequestHeaders(): RequestHeaders {
  let requestHeaders: RequestHeaders;
  requestHeaders = {
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "12344",
    // Request Id is missing
  };
  return requestHeaders;
}

export function postValidRequestBody(
  letters: SupplierApiLetters[],
): PostMessageRequestBody {
  let requestBody: PostMessageRequestBody;

  requestBody = {
    data: [
      {
        type: "Letter",
        id: letters[0].id,
        attributes: {
          status: "ACCEPTED",
        },
      },
      {
        type: "Letter",
        id: letters[1].id,
        attributes: {
          status: "REJECTED",
          reasonCode: "R01",
          reasonText: "Test Reason",
        },
      },
      {
        type: "Letter",
        id: letters[2].id,
        attributes: {
          status: "PRINTED",
        },
      },
      {
        type: "Letter",
        id: letters[3].id,
        attributes: {
          status: "CANCELLED",
        },
      },
    ],
  };
  return requestBody;
}

export function postInvalidStatusRequestBody(
  letters: SupplierApiLetters[],
): PostMessageRequestBody {
  let requestBody: PostMessageRequestBody;

  requestBody = {
    data: [
      {
        type: "Letter",
        id: letters[0].id,
        attributes: {
          status: "ACCEPTED",
        },
      },
      {
        type: "Letter",
        id: letters[1].id,
        attributes: {
          status: "SENDING", // Invalid letter status
        },
      },
    ],
  };
  return requestBody;
}

export function postDuplicateIDRequestBody(
  letters: SupplierApiLetters[],
): PostMessageRequestBody {
  let requestBody: PostMessageRequestBody;

  requestBody = {
    data: [
      {
        type: "Letter",
        id: letters[0].id,
        attributes: {
          status: "ACCEPTED",
        },
      },
      {
        type: "Letter",
        id: letters[0].id, // Duplicate id
        attributes: {
          status: "REJECTED",
        },
      },
    ],
  };
  return requestBody;
}

export function postInvalidStatusResponseBody(): ErrorMessageBody {
  let responseBody: ErrorMessageBody;

  responseBody = {
    errors: [
      {
        id: "12344",
        code: "NOTIFY_INVALID_REQUEST",
        links: {
          about:
            "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
        },
        status: "400",
        title: "Invalid request",
        detail: "The request body is invalid",
      },
    ],
  };
  return responseBody;
}

export function postDuplicateIDResponseBody(): ErrorMessageBody {
  let responseBody: ErrorMessageBody;

  responseBody = {
    errors: [
      {
        id: "12344",
        code: "NOTIFY_INVALID_REQUEST",
        links: {
          about:
            "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
        },
        status: "400",
        title: "Invalid request",
        detail:
          "The request cannot include multiple letter objects with the same id",
      },
    ],
  };
  return responseBody;
}

export function post500ErrorResponseBody(): ErrorMessageBody {
  let responseBody: ErrorMessageBody;

  responseBody = {
    errors: [
      {
        id: "12344",
        code: "NOTIFY_INTERNAL_SERVER_ERROR",
        links: {
          about:
            "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
        },
        status: "500",
        title: "Internal server error",
        detail: "Unexpected error",
      },
    ],
  };
  return responseBody;
}
