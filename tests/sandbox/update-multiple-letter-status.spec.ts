import { test, expect, request } from '@playwright/test';
import {  SUPPLIER_API_URL_SANDBOX, SUPPLIER_LETTERS} from '../constants/api-constants';
import { apiSandboxMultipleLetterStatusTestData } from './testCases/updateMultipleStatus_testCases';


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
