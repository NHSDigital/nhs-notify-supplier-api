import { expect, test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import { getLettersBySupplier } from "../../helpers/generate-fetch-test-data";
import { SUPPLIERID, SUPPLIER_LETTERS } from "../../constants/api-constants";
import { createValidRequestHeaders } from "../../constants/request-headers";
import {
  error404ResponseBody,
  error500ResponseBody,
} from "../../helpers/common-types";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
  console.log(`Base URL for API Gateway: ${baseUrl}`);
});

test.describe("API Gateway Tests to Verify Get Letter Status Endpoint", () => {
  test(`Get /letters/{id} returns 200 and valid response for a given id`, async ({
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
      `${baseUrl}/${SUPPLIER_LETTERS}/${letter.id}`,
      {
        headers,
      },
    );

    const responseBody = await response.json();

    expect(response.status()).toBe(200);
    expect(responseBody).toMatchObject({
      data: {
        attributes: {
          status: "PENDING",
          specificationId: letter.specificationId,
          groupId: letter.groupId,
        },
        id: letter.id,
        type: "Letter",
      },
    });
  });

  test(`Get /letters/{id} returns 404 if no resource is found for id`, async ({
    request,
  }) => {
    const id = "11";
    const headers = createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
      headers,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(404);
    expect(responseBody).toMatchObject(error404ResponseBody());
  });

  test(`Get /letters/{id} returns 500 if letter is not found for supplierId ${SUPPLIERID}`, async ({
    request,
  }) => {
    const id = "non-existing-id-12345";
    const headers = createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
      headers,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(500);
    expect(responseBody).toMatchObject(error500ResponseBody(id));
  });
});
