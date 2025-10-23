import { RequestSandBoxHeaders, sandBoxHeader } from "../../constants/request_headers";

export type ApiSandboxUpdateLetterStatusTestData = {
  testCase: string;
  header: RequestSandBoxHeaders;
  body: PostMessageRequestBody;
  expectedStatus: number;
};

type PostMessageRequestBody = {
    data: postRequest []
}

type postRequest = {
    type: string;
    id: string;
    attributes: {
      reasonCode?: string | number;
      reasonText?: string;
      status: string;
    }
};

export const apiSandboxMultipleLetterStatusTestData: ApiSandboxUpdateLetterStatusTestData[] =
[{
    testCase: '200 response if records are updated',
    header: sandBoxHeader,
    body:{
        data :
        [{
            attributes: {
                status: 'PENDING'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
            attributes: {
                'status': 'ACCEPTED'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
            attributes: {
                status: 'PRINTED'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
        attributes: {
            status: 'ENCLOSED'
        },
        id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
        type: 'Letter'
        },
        {
        attributes: {
            status: 'DISPATCHED'
        },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
            attributes: {
                status: 'DELIVERED'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
            attributes: {
                reasonCode: 100,
                reasonText: 'failed validation',
                status: 'RETURNED'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
            attributes: {
                reasonCode: 100,
                reasonText: 'failed validation',
                status: 'CANCELLED'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
            attributes: {
                reasonCode: 100,
                reasonText: 'failed validation',
                status: 'FAILED'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        },
        {
            attributes: {
                reasonCode: 100,
                reasonText: 'failed validation',
                status: 'RETURNED'
            },
            id: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
            type: 'Letter'
        }
    ]},
    expectedStatus: 200
},
{
    testCase: '400 response if invalid request is passed',
    header: sandBoxHeader,
    body:{
        data :
        [{
            attributes: {
                status: 'PENDING'
            },
            id: '1234',
            type: 'Letter'
        }]
    },
    expectedStatus:404,
}];
