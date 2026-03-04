import { RequestHeaders } from "../../../constants/request-headers";
import { SUPPLIERID } from "../../../constants/api-constants";
import {
  ErrorMessageBody,
  PostMessageRequestBody,
} from "../../../helpers/common-types";
import { SupplierApiLetters } from "../../../helpers/generate-fetch-test-data";

export interface LetterUpdateAttributes {
  status: string;
  reasonCode?: string;
  reasonText?: string;
}

export type LetterUpdatesById = Record<string, LetterUpdateAttributes>;

export function postLettersRequestHeaders(): RequestHeaders {
  return {
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "12344",
    "X-Request-ID": "requestId1",
  };
}

export function postLettersInvalidRequestHeaders(): RequestHeaders {
  return {
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "12344",
    // Request Id is missing
  };
}

export function postValidRequestBody(
  updatesById: LetterUpdatesById,
): PostMessageRequestBody {
  return {
    data: Object.entries(updatesById).map(([id, attributes]) => ({
      type: "Letter",
      id,
      attributes,
    })),
  };
}

export function postInvalidStatusRequestBody(
  letters: SupplierApiLetters[],
): PostMessageRequestBody {
  return {
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
}

export function postDuplicateIDRequestBody(
  letters: SupplierApiLetters[],
): PostMessageRequestBody {
  return {
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
}

export function postInvalidStatusResponseBody(): ErrorMessageBody {
  return {
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
}

export function postDuplicateIDResponseBody(): ErrorMessageBody {
  return {
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
}

export function post500ErrorResponseBody(): ErrorMessageBody {
  return {
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
}
