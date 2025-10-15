import { test, expect, request } from '@playwright/test';
import {  SUPPLIER_API_URL_SANDBOX, SUPPLIER_LETTERS} from '../constants/api_constants';
import { apiSandboxUpdateLetterStatusTestData } from './testCases/updateLetterStatus_testCases';
import { apiSandboxMultipleLetterStatusTestData } from './testCases/updateMultipleStatys_testCases';


test.describe('Sandbox Tests To Update Multiple Letter Status', () =>
{
  apiSandboxMultipleLetterStatusTestData.forEach(({ testCase, header, body, expectedStatus }) => {
    test(`Patch /Letters endpoint returns ${testCase}`, async ({ request }) => {

        const response = await request.post(`${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}` ,{
                headers: header,
                data: body
          });
          expect(response.status()).toBe(expectedStatus);
    });
  });
});
