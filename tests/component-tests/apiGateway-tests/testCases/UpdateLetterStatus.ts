
import { RequestHeaders } from '../../../constants/request_headers';
import { supplierId } from '../../../constants/api_constants';

export type PatchMessageRequestBody = {
  data: {
    type: string;
    id: string;
    attributes: {
      reasonCode?: string | number;
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
      reasonCode?: number;
      reasonText?: string;
      status: string;
      specificationId:string;
      groupId?:string;
    };
  };
};

export function patchRequestHeaders(): RequestHeaders {
  let requestHeaders: RequestHeaders;
    requestHeaders = {
        headerauth1: process.env.HEADERAUTH || '',
        'NHSD-Supplier-ID': supplierId,
        'NHSD-Correlation-ID': '12344',
        'X-Request-ID': 'requestId1'
    };
  return requestHeaders;
};


export function patchValidRequestBody (id: string, status: string) : PatchMessageRequestBody{
  let requestBody: PatchMessageRequestBody;

  requestBody = {
    data: {
       attributes: {
          status: status,
      },
      type: 'Letter',
      id: id
    }

  };
  return requestBody;
}

export function patchFailureRequestBody (id: string, status: string) : PatchMessageRequestBody{
  let requestBody: PatchMessageRequestBody;

  requestBody = {
    data: {
        attributes: {
          status: status,
          reasonCode: 123,
          reasonText: 'Test Reason'
      },
      type: 'Letter',
      id: id
    }

  };
  return requestBody;
}
