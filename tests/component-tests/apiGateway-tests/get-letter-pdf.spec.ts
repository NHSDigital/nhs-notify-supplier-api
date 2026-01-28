import { expect, test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import { getLettersBySupplier } from "../../helpers/generate-fetch-test-data";
import { SUPPLIERID, SUPPLIER_LETTERS, DATA } from "../../constants/api-constants";
import { createValidRequestHeaders } from "../../constants/request-headers";
import {
  error404ResponseBody,
  error500ResponseBody,
} from "../../helpers/common-types";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests to Verify Get Letter PDF Endpoint", () => {
  test(`Get /letters/{id}/data returns 200 and valid response for a given id`, async ({
    request,
  }) => {
    const letters = await getLettersBySupplier(SUPPLIERID, "PENDING", 1);

    if (!letters?.length) {
      test.fail(true, `No PENDING letters found for supplier ${SUPPLIERID}`);
      return;
    }
    const letter = letters[0];
    const headers = createValidRequestHeaders();
    const response = await request.get(
      `${baseUrl}/${SUPPLIER_LETTERS}/${letter.id}/${DATA}`,
      {
        headers,
      },
    );

    expect(response.status()).toBe(200);
    const responseBody = await response.text();
    expect(responseBody).toContain("PDF");
  });

  test(`Get /letters/{id}/data returns 404 if no resource is found for id`, async ({
    request,
  }) => {
    const id = "11";
    const headers = createValidRequestHeaders();
    const response = await request.get(
      `${baseUrl}/${SUPPLIER_LETTERS}/${id}/${DATA}`,
      {
        headers,
      },
    );

    const responseBody = await response.json();
    expect(response.status()).toBe(404);
    expect(responseBody).toMatchObject(error404ResponseBody());
  });

  test(`Get /letters/{id}/data returns 500 if letter is not found for supplierId ${SUPPLIERID}`, async ({
    request,
  }) => {
    const id = "non-existing-id-12345";
    const headers = createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
      headers,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(500);
    expect(responseBody).toMatchObject(error500ResponseBody());
  });
});
