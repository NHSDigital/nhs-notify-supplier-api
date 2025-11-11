import { test, expect } from '@playwright/test';
import { SUPPLIER_LETTERS, SUPPLIERID } from '../../constants/api_constants';
import { getRestApiGatewayBaseUrl } from '../../helpers/awsGatewayHelper';
import { patch400ErrorResponseBody, patch500ErrorResponseBody, patchFailureRequestBody, patchRequestHeaders, patchValidRequestBody } from './testCases/updateLetterStatus';
import { createTestData, deleteLettersBySupplier, getLettersBySupplier } from '../../helpers/generate_fetch_testData';
import { randomUUID } from 'crypto';
import { createInvalidRequestHeaders } from '../../constants/request_headers';
import { error403ResponseBody } from '../../helpers/commonTypes';

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe('API Gateway Tests to Verify Patch Status Endpoint', () => {
    test(`Patch /letters returns 200 and status is updated to ACCEPTED`, async ({ request }) => {

      await createTestData(SUPPLIERID);
      const letters = await getLettersBySupplier(SUPPLIERID, 'PENDING', 1);

      if (!letters?.length) {
        test.fail(true, `No PENDING letters found for supplier ${SUPPLIERID}`);
        return;
      }
      const letter = letters[0];
      const headers = patchRequestHeaders();
      const body = patchValidRequestBody(letter.id, 'ACCEPTED');

      const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${letter.id}`, {
          headers: headers,
          data: body
      });

    const responseBody = await response.json();
    expect(response.status()).toBe(200);
    expect(responseBody).toMatchObject({
      data:{
        attributes: {
            status: 'ACCEPTED',
            specificationId: letter.specificationId,
            groupId: letter.groupId,
        },
        id: letter.id,
        type: 'Letter'
      }
    });

    await deleteLettersBySupplier(letter.id);
  });

  test(`Patch /letters returns 200 and status is updated to REJECTED`, async ({ request }) => {

      await createTestData(SUPPLIERID);
      const letters = await getLettersBySupplier(SUPPLIERID, 'PENDING', 1);

      if (!letters?.length) {
        test.fail(true, `No PENDING letters found for supplier ${SUPPLIERID}`);
        return;
      }
      const letter = letters[0];
      const headers = patchRequestHeaders();
      const body = patchFailureRequestBody(letter.id, 'REJECTED');

      const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${letter.id}`, {
          headers: headers,
          data: body
      });

    const responseBody = await response.json();
    expect(response.status()).toBe(200);
    expect(responseBody).toMatchObject({
      data:{
        attributes: {
            status: 'REJECTED',
            specificationId: letter.specificationId,
            groupId: letter.groupId,
        },
        id: letter.id,
        type: 'Letter'
      }
    });

    await deleteLettersBySupplier(letter.id);
  });

  test(`Patch /letters returns 400 if request Body is invalid`, async ({ request }) => {

      const id = randomUUID()
      const headers = patchRequestHeaders();
      const body = patchValidRequestBody(id, '');

      const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
          headers: headers,
          data: body
      });

    const responseBody = await response.json();

    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(patch400ErrorResponseBody());
  });

    test(`Patch /letters returns 500 if Id doesn't exist for SupplierId`, async ({ request }) => {
        const headers = patchRequestHeaders();
        const id = randomUUID()
        const body = patchValidRequestBody(id, 'PENDING');

        const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
        headers: headers,
        data: body
        });

      const responseBody = await response.json();
      expect(response.status()).toBe(500);
      expect(responseBody).toMatchObject(patch500ErrorResponseBody(id));
    });

    test(`Patch /letters returns 403 for invalid headers`, async ({ request }) => {
        const headers = createInvalidRequestHeaders();
        const id = randomUUID()
        const body = patchValidRequestBody(id, 'PENDING');

        const response = await request.patch(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
            headers: headers,
            data: body
        });

      const responseBody = await response.json();
      expect(response.status()).toBe(403);
      expect(responseBody).toMatchObject(error403ResponseBody());
    });
});
