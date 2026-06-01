import { expect, test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import {
  createTestData,
  waitForLetterStatus,
} from "../../helpers/generate-fetch-test-data";
import { SUPPLIERID, SUPPLIER_LETTERS } from "../../constants/api-constants";
import { createValidRequestHeaders } from "../../constants/request-headers";
import { error404ResponseBody } from "../../helpers/common-types";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests to Verify Get Letter Status Endpoint", () => {
  test(`Get /letters/{id} returns 200 and valid response for a given id`, async ({
    request,
  }) => {
    const letterIds: string[] = await createTestData(SUPPLIERID);
    const createdLetter = await waitForLetterStatus(
      SUPPLIERID,
      letterIds[0],
      "PENDING",
    );

    const headers = createValidRequestHeaders();
    const response = await request.get(
      `${baseUrl}/${SUPPLIER_LETTERS}/${createdLetter.id}`,
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
          specificationId: createdLetter.specificationId,
          groupId: createdLetter.groupId,
        },
        id: createdLetter.id,
        type: "Letter",
      },
    });
  });

  test(`Get /letters/{id} returns 404 if letter is not found for supplierId ${SUPPLIERID}`, async ({
    request,
  }) => {
    const id = "non-existing-id-12345";
    const headers = createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
      headers,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(404);
    expect(responseBody).toMatchObject(error404ResponseBody());
  });
});
