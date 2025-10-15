import { test, expect } from '@playwright/test';
import { SUPPLIER_API_GATEWAY_NAME, SUPPLIER_LETTERS, AWS_REGION } from '../../constants/api_constants';
import { getRestApiGatewayBaseUrl } from '../../helpers/awsGatewayHelper';
import { createValidRequestHeaders } from '../../constants/request_headers';
import { apiPatchMessageRequestTestData } from './testCases/UpdateLetterStatus';

let baseUrl: string;

test.beforeAll(async () => {
  const region = AWS_REGION;
  baseUrl = await getRestApiGatewayBaseUrl(SUPPLIER_API_GATEWAY_NAME, region);
});

test.describe('API Gateway Tests To Verify Patch Status Endpoint ', () => {
  apiPatchMessageRequestTestData.forEach(({ testCase, id, body, expectedStatus, expectedResponse }) => {
      test(`Patch /letters returns ${testCase}`, async ({ request }) => {
        const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${id}` ,{
          headers: await createValidRequestHeaders(),
          data: body
          },
        );
        const res = await response.json();

        expect(response.status()).toBe(expectedStatus);
        expect(res).toEqual(expectedResponse);
    });
  });
});
