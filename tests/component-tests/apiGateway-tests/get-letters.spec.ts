import { expect, test } from "@playwright/test";
import {
  createHeaderWithNoCorrelationId,
  createInvalidRequestHeaders,
  createValidRequestHeaders,
} from "../../constants/request-headers";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import {
  getLettersWithRetry,
  isErrorResponse,
  isGetLettersResponse,
} from "../../helpers/generate-fetch-test-data";
import { SUPPLIER_LETTERS } from "../../constants/api-constants";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests To Get List Of Pending Letters", () => {
  test("GET /letters should return 200 and list items", async ({ request }) => {
    const headers = createValidRequestHeaders();
    const { responseBody, statusCode } = await getLettersWithRetry(
      request,
      baseUrl,
      headers,
      {
        lettersLimit: "2",
      },
    );

    expect(statusCode).toBe(200);
    if (!isGetLettersResponse(responseBody)) {
      throw new Error("Expected GetLettersResponse body for 200 status");
    }
    expect(responseBody.data.length).toBeGreaterThanOrEqual(1);

    for (const letter of responseBody.data) {
      expect(letter.attributes.sha256Hash).toBeDefined();
      expect(letter.attributes.sha256Hash).not.toBeNull();
    }
  });

  test("GET /letters retrieve letter should match SHA256 from GET /letter{id} of the same letter", async ({ request }) => {
    const headers = createValidRequestHeaders();
    const { responseBody, statusCode } = await getLettersWithRetry(
      request,
      baseUrl,
      headers,
      {
        lettersLimit: "2",
      },
    );

    expect(statusCode).toBe(200);
    if (!isGetLettersResponse(responseBody)) {
      throw new Error("Expected GetLettersResponse body for 200 status");
    }
    expect(responseBody.data.length).toBeGreaterThanOrEqual(1);
    const getLettersSha = responseBody.data[0].attributes.sha256Hash;
    const id = responseBody.data[0].id;
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}/${id}`, {
        headers,
      });
    const letterResponseBody = await response.json();
    expect(response.status()).toBe(200);
    expect(letterResponseBody.data.attributes.sha256Hash).toBe(getLettersSha);
  });

  test("GET /letters with invalid authentication should return 403", async ({
    request,
  }) => {
    const headers = createInvalidRequestHeaders();
    const { responseBody, statusCode } = await getLettersWithRetry(
      request,
      baseUrl,
      headers,
      {
        waitForVisibilityTimeout: false,
      },
    );
    expect(statusCode).toBe(403);
    expect(responseBody).toMatchObject({
      Message:
        "User is not authorized to access this resource with an explicit deny in an identity-based policy",
    });
  });

  test("GET /letters with empty correlationId should return 500", async ({
    request,
  }) => {
    const headers = createHeaderWithNoCorrelationId();
    const { responseBody, statusCode } = await getLettersWithRetry(
      request,
      baseUrl,
      headers,
      {
        waitForVisibilityTimeout: false,
      },
    );
    expect(statusCode).toBe(500);
    if (!isErrorResponse(responseBody)) {
      throw new Error("Expected ErrorResponse body for 500 status");
    }
    expect(responseBody.errors[0].code).toBe("NOTIFY_INTERNAL_SERVER_ERROR");
    expect(responseBody.errors[0].detail).toBe("Unexpected error");
  });

  test("GET /letters with invalid query param return 400", async ({
    request,
  }) => {
    const headers = createValidRequestHeaders();
    const { responseBody, statusCode } = await getLettersWithRetry(
      request,
      baseUrl,
      headers,
      {
        lettersLimit: "?",
        waitForVisibilityTimeout: false,
      },
    );
    expect(statusCode).toBe(400);
    expect(responseBody).toMatchObject({
      errors: [
        {
          id: "12345",
          code: "NOTIFY_INVALID_REQUEST",
          links: {
            about:
              "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier",
          },
          status: "400",
          title: "Invalid request",
          detail: "The limit parameter is not a number",
        },
      ],
    });
  });
});
