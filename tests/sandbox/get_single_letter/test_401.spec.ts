import { test, expect } from '@playwright/test';
import { SUPPLIER_LETTERS, SUPPLIER_API_URL_SANDBOX} from '../../constants/api_constants';

// Constants
const status = "PENDING";

test("401 when invalid APIKEY is passed", async ({ request }) => {
  const headers = {
    headerauth1 : 'headervalue1',
    apikey : '',
    Authorization: '1234'
  };

  const response = await request.get(`${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}` ,{
      params: {
        status: `${status}`
      },
      headers
    });

    await expect(response.status()).toBe(401);
  });
