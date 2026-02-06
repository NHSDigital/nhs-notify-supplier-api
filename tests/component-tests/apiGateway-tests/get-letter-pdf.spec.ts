import { expect, test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import { getLettersBySupplier } from "../../helpers/generate-fetch-test-data";
import {
  DATA,
  SUPPLIERID,
  SUPPLIER_LETTERS,
} from "../../constants/api-constants";
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

    async function fetchUrl(url: string) {
      const res = await request.get(url, { headers });
      return {
        status: res.status(),
        headers: res.headers(),
        buffer: await res.body().catch(() => null),
        text: await res.text().catch(() => null),
      };
    }

    const pdfUrl = await response.url(); // function returns response url though get letter data  will automatically redirect to the url in the Location header.
    const parsed = new URL(pdfUrl);
    const expiresParam = parsed.searchParams.get("X-Amz-Expires");
    const expiresSeconds = Number(expiresParam);
    expect(expiresSeconds).toBe(60);

    const waitMs = Math.max(expiresSeconds * 1000 + 2000, 0);
    await new Promise((resolve) => {
      setTimeout(resolve, waitMs);
    });

    const after = await fetchUrl(pdfUrl);
    expect(after.status).toBe(403);
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

  // CCM-14318: Remove this test
  test(`Get /letters/{id}/data returns 500 if letter is not found for supplierId ${SUPPLIERID}`, async ({
    request,
  }) => {
    const id = "non-existing-id-12345";
    const headers = createValidRequestHeaders();
    const response = await request.get(
      `
      ${baseUrl}/${SUPPLIER_LETTERS}/${id}/${DATA}`,
      {
        headers,
      },
    );

    const responseBody = await response.json();
    expect(response.status()).toBe(500);
    expect(responseBody).toMatchObject(error500ResponseBody());
  });
});
