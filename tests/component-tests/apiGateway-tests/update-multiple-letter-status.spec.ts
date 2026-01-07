import { expect, test } from "@playwright/test";
import { SUPPLIERID, SUPPLIER_LETTERS } from "../../constants/api-constants";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import {
  post500ErrorResponseBody,
  postDuplicateIDRequestBody,
  postDuplicateIDResponseBody,
  postInvalidStatusRequestBody,
  postInvalidStatusResponseBody,
  postLettersInvalidRequestHeaders,
  postLettersRequestHeaders,
  postValidRequestBody,
} from "./testCases/update-multiple-letter-status";
import {
  createTestData,
  getLettersBySupplier,
} from "../../helpers/generate-fetch-test-data";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests to Verify post Status Endpoint", () => {
  test(`post /letters returns 202 and status is updated for multiple letters`, async ({
    request,
  }) => {
    await createTestData(SUPPLIERID, 4);
    const letters = await getLettersBySupplier(SUPPLIERID, "PENDING", 4);

    if (!letters?.length) {
      test.fail(true, `No PENDING letters found for supplier ${SUPPLIERID}`);
      return;
    }

    const headers = postLettersRequestHeaders();
    const body = postValidRequestBody(letters);

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    expect(response.status()).toBe(202);
  });

  test(`Post /letters returns 400 if request has invalid status`, async ({
    request,
  }) => {
    await createTestData(SUPPLIERID, 2);
    const letters = await getLettersBySupplier(SUPPLIERID, "PENDING", 2);

    if (!letters?.length) {
      test.fail(true, `No PENDING letters found for supplier ${SUPPLIERID}`);
      return;
    }

    const headers = postLettersRequestHeaders();
    const body = postInvalidStatusRequestBody(letters);

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(postInvalidStatusResponseBody());
  });

  test(`Post /letters returns 400 if request has duplicate id`, async ({
    request,
  }) => {
    await createTestData(SUPPLIERID, 2);
    const letters = await getLettersBySupplier(SUPPLIERID, "PENDING", 2);

    if (!letters?.length) {
      test.fail(true, `No PENDING letters found for supplier ${SUPPLIERID}`);
      return;
    }

    const headers = postLettersRequestHeaders();
    const body = postDuplicateIDRequestBody(letters);

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(postDuplicateIDResponseBody());
  });

  test(`Post /letters returns 500 if request has invalid header`, async ({
    request,
  }) => {
    await createTestData(SUPPLIERID, 4);
    const letters = await getLettersBySupplier(SUPPLIERID, "PENDING", 4);

    if (!letters?.length) {
      test.fail(true, `No PENDING letters found for supplier ${SUPPLIERID}`);
      return;
    }

    const headers = postLettersInvalidRequestHeaders();
    const body = postValidRequestBody(letters);

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(500);
    expect(responseBody).toMatchObject(post500ErrorResponseBody());
  });
});
