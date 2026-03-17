import {
  RequestSandBoxHeaders,
  sandBoxHeader,
} from "../../constants/request-headers";
import { ErrorMessageBody } from "../../helpers/common-types";
import {
  NoRequestIdHeaders,
  SandboxErrorResponse,
} from "./get-list-of-letters-test-cases";

type ApiSandboxMiRequestTestCase = {
  testCase: string;
  header?: RequestSandBoxHeaders | NoRequestIdHeaders;
  body: MiRequestBody;
  expectedResponse: MiRequestBody | ErrorMessageBody | SandboxErrorResponse;
  expectedStatus: number;
};

export type MiRequestBody = {
  data: {
    type: string;
    attributes: {
      groupId: string;
      lineItem: string;
      quantity: number;
      specificationId: string;
      stockRemaining: number;
      timestamp: string;
    };
  };
};

export const apiSandboxCreateMiTestData: ApiSandboxMiRequestTestCase[] = [
  {
    testCase: "200 when a valid request is passed",
    header: sandBoxHeader,
    body: miValidSandboxRequest(),
    expectedStatus: 200,
    expectedResponse: {
      data: {
        attributes: {
          groupId: "abc123",
          lineItem: "envelope-business-standard",
          quantity: 22,
          specificationId: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
          stockRemaining: 2000,
          timestamp: "2023-11-17T14:27:51.413Z",
        },
        type: "ManagementInformation",
      },
    },
  },
  {
    testCase: "400 when a invalid timestamp is passed",
    header: sandBoxHeader,
    body: miInvalidDateSandboxRequest(),
    expectedStatus: 400,
    expectedResponse: {
      message:
        'request.body.data.attributes.timestamp should match format "date-time"',
      errors: [
        {
          path: ".body.data.attributes.timestamp",
          message: 'should match format "date-time"',
          errorCode: "format.openapi.validation",
        },
      ],
    },
  },
  {
    testCase: "404 when a invalid id is passed",
    header: sandBoxHeader,
    body: miInvalidSandboxRequest(),
    expectedStatus: 404,
    expectedResponse: {
      errors: [
        {
          id: "rrt-1931948104716186917-c-geu2-10664-3111479-3.0",
          code: "NOTIFY_RESOURCE_NOT_FOUND",
          links: {
            about:
              "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
          },
          status: "404",
          title: "Resource not found",
          detail: "No resource found with that ID",
        },
      ],
    },
  },
];

export function miValidSandboxRequest(): MiRequestBody {
  return {
    data: {
      attributes: {
        groupId: "abc123",
        lineItem: "envelope-business-standard",
        quantity: 22,
        specificationId: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
        stockRemaining: 2000,
        timestamp: "2023-11-17T14:27:51.413Z",
      },
      type: "ManagementInformation",
    },
  };
}

export function miInvalidSandboxRequest(): MiRequestBody {
  return {
    data: {
      attributes: {
        groupId: "abc123",
        lineItem: "envelope-business-standard",
        quantity: 22,
        specificationId: "",
        stockRemaining: 2000,
        timestamp: "2023-11-17T14:27:51.413Z",
      },
      type: "ManagementInformation",
    },
  };
}

export function miInvalidDateSandboxRequest(): MiRequestBody {
  return {
    data: {
      attributes: {
        groupId: "abc123",
        lineItem: "envelope-business-standard",
        quantity: 22,
        specificationId: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
        stockRemaining: 2000,
        timestamp: "yesterday",
      },
      type: "ManagementInformation",
    },
  };
}
