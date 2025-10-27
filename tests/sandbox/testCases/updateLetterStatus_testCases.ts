
import { PatchMessageRequestBody, PatchMessageResponseBody } from '../../component-tests/apiGateway-tests/testCases/UpdateLetterStatus';
import { RequestSandBoxHeaders, sandBoxHeader } from '../../constants/request_headers';
import { ErrorMessageBody } from '../../helpers/commonTypes';
import { SandboxErrorResponse } from './getListOfLetters_testCases';


export type ApiSandboxUpdateLetterStatusTestData = {
  testCase: string;
  id: string,
  header: RequestSandBoxHeaders;
  body?: PatchMessageRequestBody;
  expectedStatus: number;
  expectedResponse?: PatchMessageResponseBody | SandboxErrorResponse | ErrorMessageBody;
};

export const apiSandboxUpdateLetterStatusTestData: ApiSandboxUpdateLetterStatusTestData[] = [
  {
    testCase: '200 response if record is updated with status PENDING',
    id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
    header: sandBoxHeader,
    body: {
      data: {
        type: 'Letter',
        id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
        attributes: {
          status: 'PENDING',
        },
      }
    },
    expectedStatus: 200,
        expectedResponse: {
      data: {
        type: 'Letter',
        id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
        attributes: {
          status: 'PENDING',
          specificationId:'2WL5eYSWGzCHlGmzNxuqVusPxDg',
        },
      }
    },
  },

  {
    testCase: '200 response if record is updated with status REJECTED',
    id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
    header: sandBoxHeader,
    body: {
      data: {
        type: 'Letter',
        id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
        attributes: {
          status: 'REJECTED',
          reasonCode: 100,
          reasonText: 'failed validation',
        },
      }
    },
    expectedStatus: 200,
        expectedResponse: {
      data: {
        type: 'Letter',
        id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
        attributes: {
          reasonCode: 100,
          reasonText: 'failed validation',
          status: 'REJECTED',
          specificationId:'2WL5eYSWGzCHlGmzNxuqVusPxDg',
        },
      }
    },
  },
  {
    testCase: '404 response if no resource is found for the given id',
    id: '0',
    header: sandBoxHeader,
    body: {
      data: {
        type: 'Letter',
        id: '0',
        attributes: {
          status: 'PENDING',
        },
      }
    },
    expectedStatus: 404,
    expectedResponse: {
      errors: [{
          id: 'rrt-1931948104716186917-c-geu2-10664-3111479-3.0',
          code: 'NOTIFY_RESOURCE_NOT_FOUND',
          links: {
            about:  "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier"
          },
          status: '404',
          title: 'Resource not found',
          detail: 'No resource found with that ID'
      }]
    },
  },
  {
    testCase: '400 response if request body is invalid',
    id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
    header: sandBoxHeader,
    body: {
      data: {
        type: 'Letter',
        id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
        attributes: {
          status: 'NO_STATUS',
        },
      }
    },
    expectedStatus: 400,
    expectedResponse: {
      message: 'request.body.data.attributes.status should be equal to one of the allowed values: PENDING, ACCEPTED, REJECTED, PRINTED, ENCLOSED, CANCELLED, DISPATCHED, DELIVERED, FAILED, RETURNED, DESTROYED, FORWARDED',
      errors: [{
          path: '.body.data.attributes.status',
          message: 'should be equal to one of the allowed values: PENDING, ACCEPTED, REJECTED, PRINTED, ENCLOSED, CANCELLED, DISPATCHED, DELIVERED, FAILED, RETURNED, DESTROYED, FORWARDED',
          errorCode: 'enum.openapi.validation'
      }]
    },
  },
];
