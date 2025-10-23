import { test, expect, request } from '@playwright/test';
import {  SUPPLIER_API_URL_SANDBOX, SUPPLIER_LETTERS} from '../constants/api_constants';
import { apiSandboxUpdateLetterStatusTestData } from './testCases/updateLetterStatus_testCases';


test.describe('Sandbox Tests To Update Letter Status', () =>
{
  apiSandboxUpdateLetterStatusTestData.forEach(({ testCase, header, id, body, expectedStatus, expectedResponse }) => {
    test(`Patch /Letters endpoint returns ${testCase}`, async ({ request }) => {

        const response = await request.patch(`${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}/${id}` ,{
                headers: header,
                data: body
          });

        const res = await response.json();
        expect(response.status()).toBe(expectedStatus);
        expect(res).toEqual(expectedResponse);

    });
  });
});
