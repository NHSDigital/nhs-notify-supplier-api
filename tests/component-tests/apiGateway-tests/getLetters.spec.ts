import { test, expect } from '@playwright/test';
import { SUPPLIER_API_GATEWAY_NAME, SUPPLIER_LETTERS, AWS_REGION } from '../../constants/api_constants';
import { createHeaderWithNoCorrelationId, createInvalidRequestHeaders, createValidRequestHeaders } from '../../constants/request_headers';
import { validateApiResponse } from '../../helpers/validateJsonSchema';
import { getRestApiGatewayBaseUrl } from '../../helpers/awsGatewayHelper';

let baseUrl: string;

test.beforeAll(async () => {
  const region = AWS_REGION;
  baseUrl = await getRestApiGatewayBaseUrl(SUPPLIER_API_GATEWAY_NAME, region);
});

test.describe('API Gateway Tests To Get List Of Pending ', () =>
{
  test('GET /letters should return 200 and list items', async ({ request }) =>
  {
    const header = await createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}` ,{
      headers: header,
      params: {
        limit:'2'},
      },
    );

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    const validationResult = validateApiResponse("get", "/letters", response.status(), responseBody);
    if (validationResult) {
      console.error("API response validation failed:", validationResult);
    }

    expect(validationResult).toBeUndefined();
  });

  test('GET /letters with invalid apikey should return 403', async ({ request }) => {
    const header = await createInvalidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}` ,{
      headers: header,
      params:{
        limit:'2'
        },
      },
    );
    expect(response.status()).toBe(403);
  });


  test('GET /letters with empty correlationId should return 500', async ({ request }) => {
    const header = await createHeaderWithNoCorrelationId();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}` ,{
      headers: header,
      params:{
        limit:'2'
        },
      },
    );
    expect(response.status()).toBe(500);
    const responseBody = await response.json();

    const validationResult = validateApiResponse("get", "/letters", response.status(), responseBody);
    if (validationResult) {
      console.error("API response validation failed:", validationResult);
    }

    expect(validationResult).toBeUndefined();
  });

    test('GET /letters with invalid query param return 400', async ({ request }) => {
    const header = await createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}` ,{
        headers: header,
        params:{
          limit:'?'
        },
        },
        );
    expect(response.status()).toBe(400);
    const responseBody = await response.json();

  const validationResult = validateApiResponse("get", "/letters", response.status(), responseBody);
  if (validationResult) {
    console.error("API response validation failed:", validationResult);
  }

  expect(validationResult).toBeUndefined();
  });

});
