import { test, expect } from '@playwright/test';
import { SUPPLIER_LETTERS, supplierId } from '../../constants/api_constants';
import { getRestApiGatewayBaseUrl } from '../../helpers/awsGatewayHelper';
import { patchFailureRequestBody, patchRequestHeaders, patchValidRequestBody } from './testCases/UpdateLetterStatus';
import { createTestData, deleteLettersBySupplier, getLettersBySupplier } from '../../helpers/generate_fetch_testData';
import { randomUUID } from 'crypto';
import { createInvalidRequestHeaders } from '../../constants/request_headers';

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe('API Gateway Tests to Verify Patch Status Endpoint', () => {
    test(`Patch /letters returns 200 and status is updated to ACCEPTED`, async ({ request }) => {

      await createTestData(supplierId);
      const letters = await getLettersBySupplier(supplierId, 'PENDING', 1);

      if (!letters?.length) {
        test.fail(true, `No PENDING letters found for supplier ${supplierId}`);
        return;
      }
      const letter = letters[0];
      const headers = await patchRequestHeaders();
      const body = await patchValidRequestBody(letter.id, 'ACCEPTED');

      const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${letter.id}`, {
          headers: headers,
          data: body
      });

    const res = await response.json();
    expect(response.status()).toBe(200);
    expect(res).toMatchObject({
      data:{
        attributes: {
            status: 'ACCEPTED',
            specificationId: 'TestSpecificationID',
            groupId: 'TestGroupID',
        },
        id: letter.id,
        type: 'Letter'
      }
    });

    await deleteLettersBySupplier(letter.id);
  });

  test(`Patch /letters returns 200 and status is updated to REJECTED`, async ({ request }) => {

      await createTestData(supplierId);
      const letters = await getLettersBySupplier(supplierId, 'PENDING', 1);

      if (!letters?.length) {
        test.fail(true, `No PENDING letters found for supplier ${supplierId}`);
        return;
      }
      const letter = letters[0];
      const headers = await patchRequestHeaders();
      const body = await patchFailureRequestBody(letter.id, 'REJECTED');

      const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${letter.id}`, {
          headers: headers,
          data: body
      });

    const res = await response.json();
    expect(response.status()).toBe(200);
    await deleteLettersBySupplier(letter.id);
  });

  test(`Patch /letters returns 400 if request Body is invalid`, async ({ request }) => {

      const id = randomUUID()
      const headers = await patchRequestHeaders();
      const body = await patchValidRequestBody(id, '');

      const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
          headers: headers,
          data: body
      });

    const res = await response.json();

    expect(response.status()).toBe(400);
    });

    test(`Patch /letters returns 500 if Id doesn't exist for SupplierId`, async ({ request }) => {
        const headers = await patchRequestHeaders();
        const id = randomUUID()
        const body = await patchValidRequestBody(id, 'PENDING');

        const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
        headers: headers,
        data: body
        });

      const res = await response.json();
      expect(response.status()).toBe(500);
    });

    test(`Patch /letters returns 403 for invalid headers`, async ({ request }) => {
        const headers = await createInvalidRequestHeaders();
        const id = randomUUID()
        const body = await patchValidRequestBody(id, 'PENDING');

        const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
            headers: headers,
            data: body
        });

      const res = await response.json();
      console.log(res);
      expect(response.status()).toBe(403);
    });
});
