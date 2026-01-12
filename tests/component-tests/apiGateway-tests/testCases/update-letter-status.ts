import { RequestHeaders } from "../../../constants/request-headers";
import { SUPPLIERID } from "../../../constants/api-constants";
import { ErrorMessageBody } from "../../../helpers/common-types";

export type PatchMessageRequestBody = {
  data: {
    type: string;
    id: string;
    attributes: {
      reasonCode?: string;
      reasonText?: string;
      status: string;
    };
  };
};

export type PatchMessageResponseBody = {
  data: {
    type: string;
    id: string;
    attributes: {
      reasonCode?: string;
      reasonText?: string;
      status: string;
      specificationId: string;
      groupId?: string;
    };
  };
};

export function patchRequestHeaders(): RequestHeaders {
  let requestHeaders: RequestHeaders;
  requestHeaders = {
    headerauth1: process.env.HEADERAUTH || "",
    "NHSD-Supplier-ID": SUPPLIERID,
    "NHSD-Correlation-ID": "12344",
    "X-Request-ID": "requestId1",
  };
  return requestHeaders;
}

export function patchValidRequestBody(
  id: string,
  status: string
): PatchMessageRequestBody {
  let requestBody: PatchMessageRequestBody;

  requestBody = {
    data: {
      attributes: {
        status,
      },
      type: "Letter",
      id,
    },
  };
  return requestBody;
}

export function patchFailureRequestBody(
  id: string,
  status: string
): PatchMessageRequestBody {
  let requestBody: PatchMessageRequestBody;

  requestBody = {
    data: {
      attributes: {
        status,
        reasonCode: "R01",
        reasonText: "Test Reason",
      },
      type: "Letter",
      id,
    },
  };
  return requestBody;
}

export function patch400ErrorResponseBody(): ErrorMessageBody {
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

export function patch500ErrorResponseBody(id: string): ErrorMessageBody {
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
        detail: `Letter with id ${id} not found for supplier ${SUPPLIERID}`,
      },
    ],
  };
  return responseBody;
}
