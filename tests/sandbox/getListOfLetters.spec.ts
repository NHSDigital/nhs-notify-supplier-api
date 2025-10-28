import { test, expect, request } from '@playwright/test';
import {  SUPPLIER_API_URL_SANDBOX, SUPPLIER_LETTERS} from '../constants/api_constants';
import { apiSandboxGetLettersRequestTestData } from './testCases/getListOfLetters_testCases';


test.describe('Sandbox Tests To Get List Of Pending Letters ', () =>
{
  apiSandboxGetLettersRequestTestData.forEach(({ testCase, header, limit, expectedStatus, expectedResponse }) => {
    test(`Get /Letters endpoint returns ${testCase}`, async ({ request }) => {

    const response = await request.get(`${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}` ,{
            headers: header,
            params:{
              limit: limit
            },
          },
        );

      const res = await response.json();
      await expect(response.status()).toBe(expectedStatus);
      expect(res).toEqual(expectedResponse);
      if (response.status() === 200){
        expect(res.data.length.toString()).toEqual(limit);
      }
    });
  });
});
