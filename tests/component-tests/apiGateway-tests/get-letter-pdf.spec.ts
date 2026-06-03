import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import {
  createTestData,
  waitForLetterStatus,
} from "../../helpers/generate-fetch-test-data";
import {
  DATA,
  SUPPLIERID,
  SUPPLIER_LETTERS,
} from "../../constants/api-constants";
import { createValidRequestHeaders } from "../../constants/request-headers";
import { error404ResponseBody } from "../../helpers/common-types";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests to Verify Get Letter PDF Endpoint", () => {
  test(`Get /letters/{id}/data returns 200 and valid response for a given id`, async ({
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
      `${baseUrl}/${SUPPLIER_LETTERS}/${createdLetter.id}/${DATA}`,
      {
        headers,
      },
    );

    expect(response.status()).toBe(200);
    const responseMetadataSha256 = response.headers()["x-amz-meta-sha256"];
    expect(responseMetadataSha256).toBeDefined();

    const responseBodyBuffer = await response.body();
    expect(responseBodyBuffer.toString("utf8")).toContain("PDF");

    const downloadedPdfSha256 = createHash("sha256")
      .update(responseBodyBuffer)
      .digest("hex");
    expect(downloadedPdfSha256).toBe(responseMetadataSha256);

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

  test(`Get /letters/{id}/data returns 404 if letter is not found for supplierId ${SUPPLIERID}`, async ({
    request,
  }) => {
    const id = "non-existing-id-12345";
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
});
