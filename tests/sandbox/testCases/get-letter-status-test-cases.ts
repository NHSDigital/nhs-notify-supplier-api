import {
  RequestSandBoxHeaders,
  sandBoxHeader,
} from "../../constants/request-headers";
import { NoRequestIdHeaders } from "./get-list-of-letters-test-cases";

type ApiSandboxGetLetterStatusTestCase = {
  testCase: string;
  id: string;
  header?: RequestSandBoxHeaders | NoRequestIdHeaders;
  expectedStatus: number;
  expectedResponse?:
    | GetLetterStatusResponse
    | GetLetterStatusErrorResponse
    | GetRejectedLetterResponse;
};

export type GetLetterStatusResponse = {
  data: GetLetterData;
};

export type GetRejectedLetterResponse = {
  data: RejectedLetterData;
};

type GetLetterData = {
  type: string;
  id: string;
  attributes: {
    specificationId: string;
    groupId: string;
    status: string;
  };
};

type RejectedLetterData = {
  type: string;
  id: string;
  attributes: {
    specificationId: string;
    groupId: string;
    status: string;
    reasonCode: string;
    reasonText: string;
  };
};

export type GetLetterStatusErrorResponse = {
  errors: ApiErrors[];
};

type ApiErrors = {
  code: string;
  detail: string;
  id: string;
  links: {
    about: string;
  };
  status: string;
  title: string;
};

export const apiSandboxGetLetterStatusTestData: ApiSandboxGetLetterStatusTestCase[] =
  [
    {
      testCase: "200 response and ACCEPTED record is fetched successfully",
      id: "2AL5eYSWGzCHlGmzNxuqVusPxDg",
      header: sandBoxHeader,
      expectedStatus: 200,
      expectedResponse: {
        data: {
          id: "2AL5eYSWGzCHlGmzNxuqVusPxDg",
          type: "Letter",
          attributes: {
            specificationId: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            groupId: "c5d93f917f5546d08beccf770a915d96",
            status: "ACCEPTED",
          },
        },
      },
    },
    {
      testCase: "200 response and REJECTED record is fetched successfully",
      id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
      header: sandBoxHeader,
      expectedStatus: 200,
      expectedResponse: {
        data: {
          id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
          type: "Letter",
          attributes: {
            specificationId: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            groupId: "c5d93f917f5546d08beccf770a915d96",
            status: "REJECTED",
            reasonCode: "R01",
            reasonText: "failed validation",
          },
        },
      },
    },
    {
      testCase: "200 response and CANCELLED record is fetched successfully",
      id: "2XL5eYSWGzCHlGmzNxuqVusPxDg",
      header: sandBoxHeader,
      expectedStatus: 200,
      expectedResponse: {
        data: {
          id: "2XL5eYSWGzCHlGmzNxuqVusPxDg",
          type: "Letter",
          attributes: {
            specificationId: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            groupId: "c5d93f917f5546d08beccf770a915d96",
            status: "CANCELLED",
            reasonCode: "R01",
          },
        },
      },
    },
    {
      testCase: "404 response when no record is found for the given id",
      id: "24L5eYSWGzCHlGmzNxuqVusP",
      header: sandBoxHeader,
      expectedStatus: 200,
      expectedResponse: {
        errors: [
          {
            status: "404",
            title: "Resource not found",
            code: "NOTIFY_RESOURCE_NOT_FOUND",
            detail: "No resource found with that ID",
            id: "rrt-1931948104716186917-c-geu2-10664-3111479-3.0",
            links: {
              about:
                "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
            },
          },
        ],
      },
    },
  ];
