import { test, expect, request } from '@playwright/test';
import {  SUPPLIER_API_URL_SANDBOX, SUPPLIER_LETTERS} from '../constants/api_constants';
import { apiSandboxGetLetterStatusTestData } from './testCases/getLetterStatus_testCases';


test.describe('Sandbox Tests To Get Letter Status', () =>
{
  apiSandboxGetLetterStatusTestData.forEach(({ testCase, header, id, expectedStatus, expectedResponse }) => {
    test(`Get Letter Status endpoint returns ${testCase}`, async ({ request }) => {

        const response = await request.get(`${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}/${id}` ,{
                headers: header
            },
            );

        const res = await response.json();
        expect(res).toEqual(expectedResponse);

    });
  });
});
