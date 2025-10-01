import { test, expect, APIRequestContext } from '@playwright/test';
import { json } from 'stream/consumers';

test.describe('API Gateway', () => {
  test('GET /items should return 200 and list items', async ({ request }) => {

    const response = await request.get(
      'https://8mu4ycde02.execute-api.eu-west-2.amazonaws.com/main/letters',{
        params:{
            limit:'2'
        },
          headers: {
            'headerauth1': 'headervalue1',
            'nhsd-supplier-id':'70735ec9-3ba5-4fb0-bb01-b56d2df24bc',
            'nhsd-correlation-id':'1234',
      },
  });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    console.log(JSON.stringify(responseBody, null, 2));
  });
});
