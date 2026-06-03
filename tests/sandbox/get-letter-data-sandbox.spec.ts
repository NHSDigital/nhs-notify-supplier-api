import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import {
  SUPPLIER_API_URL_SANDBOX,
  SUPPLIER_LETTERS,
} from "../constants/api-constants";
import {
  RequestSandBoxHeaders,
  sandBoxHeader,
  sandBoxHeaderWithHash,
} from "../constants/request-headers";

test.describe("Sandbox Tests To Get Letter Data", () => {
  test(`Get Letter Data endpoint returns 200 for valid id`, async ({
    request,
  }) => {
    const id = "2AL5eYSWGzCHlGmzNxuqVusPxDg";
    const headers: RequestSandBoxHeaders = sandBoxHeaderWithHash;
    const response = await request.get(
      `${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}/${id}/data`,
      {
        headers,
      },
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch("application/pdf");

    const responseBodyBuffer = await response.body();
    const computedSha256 = createHash("sha256")
      .update(responseBodyBuffer)
      .digest("hex");

    const expectedSha256 = sandBoxHeaderWithHash["x-amz-meta-sha256"];
    expect(expectedSha256).toBeDefined();
    expect(computedSha256).toBe(expectedSha256); // Will need to change the header to include the actual hash of the sandbox pdf for this to work
  });
  test(`Get Letter Data endpoint returns 404 for invalid id`, async ({
    request,
  }) => {
    const id = "invalid-id";
    const headers: RequestSandBoxHeaders = sandBoxHeader;
    const response = await request.get(
      `${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}/${id}/data`,
      {
        headers,
      },
    );

    expect(response.status()).toBe(404);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      errors: [
        {
          code: "NOTIFY_RESOURCE_NOT_FOUND",
          detail: "No resource found with that ID",
          id: expect.any(String),
          links: {
            about:
              "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
          },
          status: "404",
          title: "Resource not found",
        },
      ],
    });
  });
});
