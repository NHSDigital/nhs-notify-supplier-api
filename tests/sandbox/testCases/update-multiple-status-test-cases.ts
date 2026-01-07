import {
  RequestSandBoxHeaders,
  sandBoxHeader,
} from "../../constants/request-headers";
import { PostMessageRequestBody } from "../../helpers/common-types";

export type ApiSandboxUpdateLetterStatusTestData = {
  testCase: string;
  header: RequestSandBoxHeaders;
  body: PostMessageRequestBody;
  expectedStatus: number;
};

export const apiSandboxMultipleLetterStatusTestData: ApiSandboxUpdateLetterStatusTestData[] =
  [
    {
      testCase: "200 response if records are updated",
      header: sandBoxHeader,
      body: {
        data: [
          {
            attributes: {
              status: "PENDING",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              status: "ACCEPTED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              status: "PRINTED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              status: "ENCLOSED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              status: "DISPATCHED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              status: "DELIVERED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              reasonCode: "R01",
              reasonText: "failed validation",
              status: "RETURNED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              reasonCode: "R01",
              reasonText: "failed validation",
              status: "CANCELLED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              reasonCode: "R01",
              reasonText: "failed validation",
              status: "FAILED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
          {
            attributes: {
              reasonCode: "R01",
              reasonText: "failed validation",
              status: "RETURNED",
            },
            id: "2WL5eYSWGzCHlGmzNxuqVusPxDg",
            type: "Letter",
          },
        ],
      },
      expectedStatus: 200,
    },
    {
      testCase: "404 response if invalid request is passed",
      header: sandBoxHeader,
      body: {
        data: [
          {
            attributes: {
              status: "PENDING",
            },
            id: "1234",
            type: "Letter",
          },
        ],
      },
      expectedStatus: 404,
    },
  ];
