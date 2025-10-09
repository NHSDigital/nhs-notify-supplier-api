
import { createValidRequestHeaders, RequestHeaders } from '../../../constants/request_headers';
import { test } from '@playwright/test';

type APIPatchMessageRequestTestCase = {
  testCase: string;
  id: string,
  body?: PatchMessageRequestBody;
  expectedStatus: number;
  expectedResponse?: PatchMessageResponseBody | PatchErrorMessageBody;
};

type PatchMessageRequestBody = {
  data: {
    type: string;
    id: string;
    attributes: {
      reasonCode: number;
      reasonText: string;
      status: string;
    };
  };
};

type PatchMessageResponseBody = {
  data: {
    type: string;
    id: string;
    attributes: {
      reasonCode: number;
      reasonText: string;
      status: string;
      specificationId:string;
      groupId:string;
    };
  };
};

export type ErrorLink = {
  about: string;
};

type PatchErrorResponse = {
  id: string;
  code: string;
  links: ErrorLink;
  status: string;
  title: string;
  detail: string;
};

type PatchErrorMessageBody = {
  errors: PatchErrorResponse[];
};



export const apiPatchMessageRequestTestData: APIPatchMessageRequestTestCase[] = [
  {
    testCase: '200 response if record is updated and status is REJECTED',
    id: '00c61654-24f0-410e-a77e-04deef7d1eeb',
    body: {
      data: {
        type: 'Letter',
        id: '00c61654-24f0-410e-a77e-04deef7d1eeb',
        attributes: {
          reasonCode: 123,
          reasonText: 'Test Reason Text',
          status: 'REJECTED',
        },
      }
    },
    expectedStatus: 200,
        expectedResponse: {
      data: {
        type: 'Letter',
        id: '00c61654-24f0-410e-a77e-04deef7d1eeb',
        attributes: {
          reasonCode: 123,
          reasonText: 'Test Reason Text',
          status: 'REJECTED',
          specificationId:'specification-id',
          groupId:'group-id'
        },
      }
    },
  },

  {
    testCase: '400 response if request body is invalid',
    id: '00c61654-24f0-410e-a77e-04deef7d1eeb',
    body: {
      data: {
        type: 'Letter',
        id: '00c61654-24f0-410e-a77e-04deef7d1eeb',
        attributes: {
          reasonCode: 123,
          reasonText: 'Test Reason Text',
          status: '',
        },
      }
    },
    expectedStatus: 400,
    expectedResponse: {
      errors: [{
          id: '1234',
          code: 'NOTIFY_INVALID_REQUEST',
          links: {
            about:  "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier"
          },
          status: '400',
          title: 'Invalid request',
          detail: 'The request body is invalid'
      }]
    },
  },
];
