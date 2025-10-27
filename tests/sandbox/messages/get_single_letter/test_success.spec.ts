import { test, expect } from '@playwright/test';
import { LETTERS_ENDPOINT} from '../../../constants/api_constants';

// Constants
const STATUS = 'PENDING';

test("200 when valid input is passed", async ({ request }) => {
  const headers = {
    headerauth1: 'headervalue1',
    apikey: process.env.API_KEY!,
    Authorization: '1234'
  };

  const API_URL = process.env.DEV_API_GATEWAY_URL;
  const API_GATEWAY_URL = `${API_URL}${LETTERS_ENDPOINT}`;

  const response = await request.get(API_GATEWAY_URL, {
      params: {
        status: `${STATUS}`
      },
      headers
    });

    await expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
  });
