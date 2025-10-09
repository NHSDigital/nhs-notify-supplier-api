import { test, expect, request } from '@playwright/test';
import {  SUPPLIER_API_URL_SANDBOX, SUPPLIER_LETTERS} from '../../constants/api_constants';
import { createValidSandBoxRequestHeaders } from '../../constants/request_headers';

test("200 when valid input is passed", async ({ request }) => {

  const header = await createValidSandBoxRequestHeaders();

  const response = await request.get(`${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}` ,{
          headers: header,
          params:{
            limit:'2'
          },
        },
      );


    await expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
  });
