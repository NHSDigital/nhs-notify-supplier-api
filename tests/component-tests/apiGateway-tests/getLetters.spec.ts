import { expect, test } from "@playwright/test";
import { SUPPLIER_LETTERS } from "../../constants/api_constants";
import {
  createHeaderWithNoCorrelationId,
  createInvalidRequestHeaders,
  createValidRequestHeaders,
} from "../../constants/request_headers";
import { getRestApiGatewayBaseUrl } from "../../helpers/awsGatewayHelper";
import { validateApiResponse } from "../../helpers/validateJsonSchema";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests To Get List Of Pending Letters", () => {
  test("GET /letters should return 200 and list items", async ({ request }) => {
    const header = createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers: header,
      params: {
        limit: "2",
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.data.length).toBeGreaterThanOrEqual(1);

    const validationResult = validateApiResponse(
      "get",
      "/letters",
      response.status(),
      responseBody,
    );
    if (validationResult) {
      console.error("API response validation failed:", validationResult);
    }
    expect(validationResult).toBeUndefined();
  });

  test("GET /letters with invalid authentication should return 403", async ({
    request,
  }) => {
    const header = createInvalidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers: header,
      params: {
        limit: "2",
      },
    });
    expect(response.status()).toBe(403);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      Message:
        "User is not authorized to access this resource with an explicit deny in an identity-based policy",
    });
  });

  test("GET /letters with empty correlationId should return 500", async ({
    request,
  }) => {
    const header = createHeaderWithNoCorrelationId();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers: header,
      params: {
        limit: "2",
      },
    });
    expect(response.status()).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.errors[0].code).toBe("NOTIFY_INTERNAL_SERVER_ERROR");
    expect(responseBody.errors[0].detail).toBe("Unexpected error");
  });

  test("GET /letters with invalid query param return 400", async ({
    request,
  }) => {
    const header = createValidRequestHeaders();
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers: header,
      params: {
        limit: "?",
      },
    });
    expect(response.status()).toBe(400);
    const responseBody = await response.json();
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
