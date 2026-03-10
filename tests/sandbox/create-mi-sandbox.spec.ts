import { expect, test } from "@playwright/test";
import {
  MI_ENDPOINT,
  SUPPLIER_API_URL_SANDBOX,
} from "tests/constants/api-constants";
import { apiSandboxCreateMiTestData } from "./testCases/create-mi-test-cases";

test.describe("Sandbox Tests To Verify Mi Endpoint", () => {
  for (const {
    body,
    expectedResponse,
    expectedStatus,
    header,
    testCase,
  } of apiSandboxCreateMiTestData) {
    test(`Post /Mi endpoint returns ${testCase}`, async ({ request }) => {
      const response = await request.post(
        `${SUPPLIER_API_URL_SANDBOX}/${MI_ENDPOINT}`,
        {
          headers: header,
          data: body,
        },
      );
      expect(response.status()).toBe(expectedStatus);
      const responseBody = await response.json();
      expect(responseBody).toMatchObject(expectedResponse);
    });
  }
});
