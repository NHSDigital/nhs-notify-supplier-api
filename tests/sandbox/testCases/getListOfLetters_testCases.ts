import { RequestSandBoxHeaders, sandBoxHeader} from '../../constants/request_headers';
import { randomUUID } from 'node:crypto';


type ApiSandboxGetLettersRequestTestCase = {
  testCase: string;
  limit: string,
  header?: RequestSandBoxHeaders | NoRequestIdHeaders;
  expectedStatus: number;
  expectedResponse?: SandboxSuccessResponse | SandboxErrorResponse;
};

export type SandboxSuccessResponse = {
    data: ApiData [];
};

type ApiData =
{
    type: string;
    id: string;
    attributes: {
        specificationId: string;
        groupId: string;
        status: string;
    }
};

export type SandboxErrorResponse = {
    message: string;
    errors: ApiErrors[];
};

type ApiErrors = {
    path: string;
    message: string;
    errorCode: string;
};

export type NoRequestIdHeaders = Omit<RequestSandBoxHeaders, 'X-Request-ID'>;

const NoRequestIdHeaders: NoRequestIdHeaders = {
  'Content-Type': 'application/vnd.api+json',
  'X-Correlation-ID': randomUUID(),
};

export const apiSandboxGetLettersRequestTestData: ApiSandboxGetLettersRequestTestCase[] = [
{
    testCase: '200 response if record is fetched successfully',
    limit: '1',
    header: sandBoxHeader,
    expectedStatus: 200,
    expectedResponse: {
        data: [
        {
            id: 'fcfd849ceec940e8832b41f4fc161e09',
            type: 'Letter',
            attributes: {
                specificationId: '2WL5eYSWGzCHlGmzNxuqVusPxDg',
                groupId: 'c5d93f917f5546d08beccf770a915d96',
                status: 'PENDING',
            },
        }]
    },
},
{
    testCase: '400 response if invalid limit is passed',
    limit: 'XX',
    header: sandBoxHeader,
    expectedStatus: 400,
    expectedResponse: {
        message: 'request.query.limit should be number',
        errors: [
            {
                path:'.query.limit',
                message:'should be number',
                errorCode:'type.openapi.validation'
            }
        ]
    }
},

{
    testCase: '400 response if invalid headers are passed',
    limit: '2',
    header: NoRequestIdHeaders,
    expectedStatus: 400,
    expectedResponse: {
        message: "request.headers should have required property 'x-request-id'",
        errors: [
            {
                path: '.headers.x-request-id',
                message: "should have required property 'x-request-id'",
                errorCode:'required.openapi.validation'
            }
        ]
    }
}];
