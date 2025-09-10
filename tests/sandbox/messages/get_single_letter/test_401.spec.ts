import { test, expect } from '@playwright/test';
import { LETTERS_ENDPOINT} from '../../../constants/api_constants';

// Constants
const status = "PENDING";

test("401 when invalid APIKEY is passed", async ({ request }) => {
  const headers = {
    headerauth1 : 'headervalue1',
    apikey : '',
    Authorization: '1234'
  };

  const API_URL = process.env.DEV_API_GATEWAY_URL;
  const API_GATEWAY_URL = `${API_URL}${LETTERS_ENDPOINT}`;

  const response = await request.get(API_GATEWAY_URL, {
      params: {
        status: `${status}`
      },
      headers
    });

    await expect(response.status()).toBe(401);
  });
