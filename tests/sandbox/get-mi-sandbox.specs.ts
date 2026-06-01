import { expect, test } from "@playwright/test";
import {
  MI_ENDPOINT,
  SUPPLIER_API_URL_SANDBOX,
} from "tests/constants/api-constants";
import { apiSandboxGetMiTestData } from "./testCases/get-mi-test-cases";

test.describe("Sandbox Tests To Verify Get Mi Endpoint", () => {
  for (const {
    id,
    expectedResponse,
    expectedStatus,
    header,
    testCase,
  } of apiSandboxGetMiTestData) {
    test(`Get /Mi endpoint returns ${testCase}`, async ({ request }) => {
      const response = await request.get(
        `${SUPPLIER_API_URL_SANDBOX}/${MI_ENDPOINT}/${id}`,
        {
          headers: header,
        },
      );
      expect(response.status()).toBe(expectedStatus);
      const responseBody = await response.json();
      expect(responseBody).toMatchObject(expectedResponse);
    });
  }
});
