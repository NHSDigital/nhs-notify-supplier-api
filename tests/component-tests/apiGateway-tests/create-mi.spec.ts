import { expect, test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import { MI_ENDPOINT } from "../../constants/api-constants";
import {
  createHeaderWithNoCorrelationId,
  createHeaderWithNoRequestId,
  createInvalidRequestHeaders,
  createValidRequestHeaders,
} from "../../constants/request-headers";
import {
  miInvalidDateRequest,
  miInvalidRequest,
  miValidRequest,
} from "./testCases/create-mi";
import {
  error400InvalidDate,
  error400ResponseBody,
  error403ResponseBody,
  requestId500Error,
} from "../../helpers/common-types";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests to Verify Mi Endpoint", () => {
  test(`Post /mi returns 200 when a valid request is passed`, async ({
    request,
  }) => {
    const headers = createValidRequestHeaders();
    const body = miValidRequest();

    const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(201);
    expect(responseBody.data.attributes).toMatchObject({
      groupId: "group123",
      lineItem: "envelope-business-standard",
      quantity: 10,
      specificationId: "Test-Spec-Id",
      stockRemaining: 100,
      timestamp: body.data.attributes.timestamp,
    });
    expect(responseBody.data.type).toBe("ManagementInformation");
  });

  test(`Post /mi returns 400 when a invalid request is passed`, async ({
    request,
  }) => {
    const headers = createValidRequestHeaders();
    const body = miInvalidRequest();

    const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(error400ResponseBody());
  });

  test(`Post /mi returns 403 when a authentication header is not passed`, async ({
    request,
  }) => {
    const headers = createInvalidRequestHeaders();
    const body = miValidRequest();

    const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(403);
    expect(responseBody).toMatchObject(error403ResponseBody());
  });

  test(`Post /mi returns 500 when a correlationId is not passed`, async ({
    request,
  }) => {
    const headers = createHeaderWithNoCorrelationId();
    const body = miValidRequest();

    const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
      headers,
      data: body,
    });

    const res = await response.json();
    expect(response.status()).toBe(500);
    expect(res.errors[0].detail).toBe("Unexpected error");
  });

  test(`Post /mi returns 500 when a x-request-id is not passed`, async ({
    request,
  }) => {
    const headers = createHeaderWithNoRequestId();
    const body = miValidRequest();

    const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(500);
    expect(responseBody).toMatchObject(requestId500Error());
  });

  test(`Post /mi returns 400 when a invalid Date is passed`, async ({
    request,
  }) => {
    const headers = createValidRequestHeaders();
    const body = miInvalidDateRequest();

    const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();
    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(error400InvalidDate());
  });
});
