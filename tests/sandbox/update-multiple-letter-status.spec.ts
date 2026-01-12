import { expect, test } from "@playwright/test";
import {
  SUPPLIER_API_URL_SANDBOX,
  SUPPLIER_LETTERS,
} from "../constants/api-constants";
import { apiSandboxMultipleLetterStatusTestData } from "./testCases/update-multiple-status-test-cases";

test.describe("Sandbox Tests To Update Multiple Letter Status", () => {
  for (const {
    body,
    expectedStatus,
    header,
    testCase,
  } of apiSandboxMultipleLetterStatusTestData) {
    test(`Patch /Letters endpoint returns ${testCase}`, async ({ request }) => {
      const response = await request.post(
        `${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}`,
        {
          headers: header,
          data: body,
        }
      );
      expect(response.status()).toBe(expectedStatus);
    });
  }
});
