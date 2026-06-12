import {
  RequestSandBoxHeaders,
  sandBoxHeader,
} from "../../constants/request-headers";
import { ErrorMessageBody } from "../../helpers/common-types";
import {
  NoRequestIdHeaders,
  SandboxErrorResponse,
} from "./get-list-of-letters-test-cases";

type ApiSandboxMiGetRequestTestCase = {
  testCase: string;
  header?: RequestSandBoxHeaders | NoRequestIdHeaders;
  id: string;
  expectedResponse: MiRequestResponse | ErrorMessageBody | SandboxErrorResponse;
  expectedStatus: number;
};

export type MiRequestResponse = {
  data: {
    type: string;
    id: string;
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

export const apiSandboxGetMiTestData: ApiSandboxMiGetRequestTestCase[] = [
  {
    testCase: "200 when a valid request is passed",
    id: "2AL5eYSWGzCHlGmzNxuqVusPxDg",
    header: sandBoxHeader,
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
        id: "2AL5eYSWGzCHlGmzNxuqVusPxDg",
      },
    },
  },
  {
    testCase: "404 when a invalid id is passed",
    header: sandBoxHeader,
    id: "invalid-id",
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

export function miValidSandboxResponse(): MiRequestResponse {
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
      id: "2AL5eYSWGzCHlGmzNxuqVusPxDg",
    },
  };
}
