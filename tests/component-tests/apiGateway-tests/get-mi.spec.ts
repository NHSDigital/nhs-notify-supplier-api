import { expect, test } from "@playwright/test";
import { MI_ENDPOINT } from "tests/constants/api-constants";
import {
  createHeaderWithNoCorrelationId,
  createInvalidRequestHeaders,
  createValidRequestHeaders,
} from "../../constants/request-headers";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import {
  getMI,
  isErrorResponse,
  isGetMIResponse,
} from "../../helpers/generate-fetch-test-data";
import { miValidRequest } from "./testCases/create-mi";

let baseUrl: string;
let insertedId: string;
let insertedTimestamp: string;

test.beforeAll(async ({ request }) => {
  baseUrl = await getRestApiGatewayBaseUrl();
  const headers = createValidRequestHeaders();
  const body = miValidRequest();

  const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
    headers,
    data: body,
  });

  const miResponseBody = await response.json();
  insertedId = miResponseBody.data.id;
  insertedTimestamp = miResponseBody.data.attributes.timestamp;
});

test.describe("API Gateway Tests To Get MI data", () => {
  test("GET /mi should return 200 and MI data for specified id", async ({
    request,
  }) => {
    const headers = createValidRequestHeaders();
    const { responseBody, statusCode } = await getMI(
      insertedId,
      request,
      baseUrl,
      headers,
    );

    expect(statusCode).toBe(200);
    if (!isGetMIResponse(responseBody)) {
      throw new Error("Expected GetMIResponse body for 200 status");
    }
    expect(responseBody.data.attributes).toMatchObject({
      groupId: "group123",
      lineItem: "envelope-business-standard",
      quantity: 10,
      specificationId: "Test-Spec-Id",
      stockRemaining: 100,
      timestamp: insertedTimestamp,
    });
    expect(responseBody.data.type).toBe("ManagementInformation");
});

  test("GET /mi with invalid authentication should return 403", async ({
    request,
  }) => {
    const headers = createInvalidRequestHeaders();
    const { responseBody, statusCode } = await getMI(
      insertedId,
      request,
      baseUrl,
      headers,
    );
    expect(statusCode).toBe(403);
    expect(responseBody).toMatchObject({
      Message:
        "User is not authorized to access this resource with an explicit deny in an identity-based policy",
    });
  });

  test("GET /mi with empty correlationId should return 500", async ({
    request,
  }) => {
    const headers = createHeaderWithNoCorrelationId();
    const { responseBody, statusCode } = await getMI(
      insertedId,
      request,
      baseUrl,
      headers,
    );
    expect(statusCode).toBe(500);
    if (!isErrorResponse(responseBody)) {
      throw new Error("Expected ErrorResponse body for 500 status");
    }
    expect(responseBody.errors[0].code).toBe("NOTIFY_INTERNAL_SERVER_ERROR");
    expect(responseBody.errors[0].detail).toBe("Unexpected error");
  });
});
