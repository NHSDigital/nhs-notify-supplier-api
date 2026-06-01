import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { SUPPLIERID, SUPPLIER_LETTERS } from "../../constants/api-constants";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import {
  patch400ErrorResponseBody,
  patchFailureRequestBody,
  patchRequestHeaders,
  patchValidRequestBody,
} from "./testCases/update-letter-status";
import {
  createTestData,
  waitForLetterStatus,
} from "../../helpers/generate-fetch-test-data";
import { createInvalidRequestHeaders } from "../../constants/request-headers";
import {
  error400IdError,
  error403ResponseBody,
} from "../../helpers/common-types";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests to Verify Patch Status Endpoint", () => {
  test(`Patch /letters returns 202 and status is updated to ACCEPTED`, async ({
    request,
  }) => {
    const letterIds: string[] = await createTestData(SUPPLIERID);
    const createdLetter = await waitForLetterStatus(
      SUPPLIERID,
      letterIds[0],
      "PENDING",
    );
    const headers = patchRequestHeaders();
    const body = patchValidRequestBody(createdLetter.id, "ACCEPTED");

    const response = await request.patch(
      `${baseUrl}/${SUPPLIER_LETTERS}/${createdLetter.id}`,
      {
        headers,
        data: body,
      },
    );

    expect(response.status()).toBe(202);

    const updated = await waitForLetterStatus(
      SUPPLIERID,
      createdLetter.id,
      "ACCEPTED",
    );
    expect(updated.status).toBe("ACCEPTED");
  });

  test(`Patch /letters returns 202 and status is updated to REJECTED`, async ({
    request,
  }) => {
    const letterIds: string[] = await createTestData(SUPPLIERID);
    const createdLetter = await waitForLetterStatus(
      SUPPLIERID,
      letterIds[0],
      "PENDING",
    );
    const headers = patchRequestHeaders();
    const body = patchFailureRequestBody(createdLetter.id, "REJECTED");

    const response = await request.patch(
      `${baseUrl}/${SUPPLIER_LETTERS}/${createdLetter.id}`,
      {
        headers,
        data: body,
      },
    );

    expect(response.status()).toBe(202);

    const updated = await waitForLetterStatus(
      SUPPLIERID,
      createdLetter.id,
      "REJECTED",
    );
    expect(updated.status).toBe("REJECTED");
  });

  test(`Patch /letters returns 400 if request Body is invalid`, async ({
    request,
  }) => {
    const id = randomUUID();
    const headers = patchRequestHeaders();
    const body = patchValidRequestBody(id, "");

    const response = await request.patch(
      `${baseUrl}/${SUPPLIER_LETTERS}/${id}`,
      {
        headers,
        data: body,
      },
    );

    const responseBody = await response.json();

    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(patch400ErrorResponseBody());
  });

  test(`Patch /letters returns 400 if Id doesn't match with Id in request`, async ({
    request,
  }) => {
    const headers = patchRequestHeaders();
    const id = randomUUID();
    const body = patchValidRequestBody("Id", "PENDING");

    const response = await request.patch(
      `${baseUrl}/${SUPPLIER_LETTERS}/${id}`,
      {
        headers,
        data: body,
      },
    );

    const responseBody = await response.json();
    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(error400IdError());
  });

  test(`Patch /letters returns 403 for invalid headers`, async ({
    request,
  }) => {
    const headers = createInvalidRequestHeaders();
    const id = randomUUID();
    const body = patchValidRequestBody(id, "PENDING");

    const response = await request.patch(
      `${baseUrl}/${SUPPLIER_LETTERS}/${id}`,
      {
        headers,
        data: body,
      },
    );

    const responseBody = await response.json();
    expect(response.status()).toBe(403);
    expect(responseBody).toMatchObject(error403ResponseBody());
  });
});
