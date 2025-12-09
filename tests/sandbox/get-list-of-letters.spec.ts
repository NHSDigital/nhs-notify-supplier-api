import { expect, test } from "@playwright/test";
import {
  SUPPLIER_API_URL_SANDBOX,
  SUPPLIER_LETTERS,
} from "../constants/api-constants";
import { apiSandboxGetLettersRequestTestData } from "./testCases/get-list-of-letters-test-cases";

test.describe("Sandbox Tests To Get List Of Pending Letters ", () => {
  for (const {
    expectedResponse,
    expectedStatus,
    header,
    limit,
    testCase,
  } of apiSandboxGetLettersRequestTestData) {
    test(`Get /Letters endpoint returns ${testCase}`, async ({ request }) => {
      const response = await request.get(
        `${SUPPLIER_API_URL_SANDBOX}/${SUPPLIER_LETTERS}`,
        {
          headers: header,
          params: {
            limit,
          },
        },
      );

      const res = await response.json();
      await expect(response.status()).toBe(expectedStatus);
      expect(res).toEqual(expectedResponse);
      if (response.status() === 200) {
        expect(res.data.length.toString()).toEqual(limit);
      }
    });
  }
});
