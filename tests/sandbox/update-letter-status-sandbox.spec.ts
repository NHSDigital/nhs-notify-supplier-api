import { expect, test } from "@playwright/test";
import {
  SUPPLIER_API_URL_SANDBOX,
  SUPPLIER_LETTERS,
} from "../constants/api-constants";
import { apiSandboxUpdateLetterStatusTestData } from "./testCases/update-letter-status-test-cases";

test.describe("Sandbox Tests To Update Letter Status", () => {
  for (const {
    body,
    expectedResponse,
    expectedStatus,
    header,
    id,
    testCase,
  } of apiSandboxUpdateLetterStatusTestData) {
    test(`Patch /Letters endpoint returns ${testCase}`, async ({ request }) => {
      const response = await request.patch(
        `${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}/${id}`,
        {
          headers: header,
          data: body,
        },
      );

      expect(response.status()).toBe(expectedStatus);
      if (response.status() !== 202) {
        const responseBody = await response.json();
        expect(responseBody).toEqual(expectedResponse);
      }
    });
  }
});
