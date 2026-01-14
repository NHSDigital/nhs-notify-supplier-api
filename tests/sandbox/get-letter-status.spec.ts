import { expect, test } from "@playwright/test";
import {
  SUPPLIER_API_URL_SANDBOX,
  SUPPLIER_LETTERS,
} from "../constants/api-constants";
import { apiSandboxGetLetterStatusTestData } from "./testCases/get-letter-status-test-cases";

test.describe("Sandbox Tests To Get Letter Status", () => {
  for (const {
    expectedResponse,
    expectedStatus,
    header,
    id,
    testCase,
  } of apiSandboxGetLetterStatusTestData) {
    test(`Get Letter Status endpoint returns ${testCase}`, async ({
      request,
    }) => {
      const response = await request.get(
        `${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}/${id}`,
        {
          headers: header,
        },
      );

      expect(response.status()).toBe(expectedStatus);
      const res = await response.json();
      expect(res).toEqual(expectedResponse);
    });
  }
});
