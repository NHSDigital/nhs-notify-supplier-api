import { SUPPLIERID } from "../constants/api-constants";

export type ErrorLink = {
  about: string;
};

type ErrorResponse = {
  id: string;
  code: string;
  links: ErrorLink;
  status: string;
  title: string;
  detail: string;
};

export type ErrorMessageBody = {
  errors: ErrorResponse[];
};

export function error404ResponseBody(): ErrorMessageBody {
  let responseBody: ErrorMessageBody;
  responseBody = {
    errors: [
      {
        id: "12345",
        code: "NOTIFY_LETTER_NOT_FOUND",
        links: {
          about:
            "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
        },
        status: "404",
        title: "Not found",
        detail: "No resource found with that ID",
      },
    ],
  };
  return responseBody;
}

export function error500ResponseBody(id: string): ErrorMessageBody {
  let responseBody: ErrorMessageBody;
  responseBody = {
    errors: [
      {
        id: "12345",
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

export function error400ResponseBody(): ErrorMessageBody {
  let responseBody: ErrorMessageBody;
  responseBody = {
    errors: [
      {
        id: "12345",
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

export function requestId500Error(): ErrorMessageBody {
  let responseBody: ErrorMessageBody;

  responseBody = {
    errors: [
      {
        id: "1234",
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

export function error403ResponseBody(): { Message: string } {
  return {
    Message:
      "User is not authorized to access this resource with an explicit deny in an identity-based policy",
  };
}

export function error400InvalidDate(): ErrorMessageBody {
  let responseBody: ErrorMessageBody;
  responseBody = {
    errors: [
      {
        id: "12345",
        code: "NOTIFY_INVALID_REQUEST",
        links: {
          about:
            "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
        },
        status: "400",
        title: "Invalid request",
        detail:
          "Timestamps should be UTC date/times in ISO8601 format, with a Z suffix",
      },
    ],
  };
  return responseBody;
}

export function error400IdError(): ErrorMessageBody {
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
          "The letter ID in the request body does not match the letter ID path parameter",
      },
    ],
  };
  return responseBody;
}
