import { expect, test } from "@playwright/test";
import { SUPPLIERID, SUPPLIER_LETTERS } from "../../constants/api-constants";
import getRestApiGatewayBaseUrl from "../../helpers/aws-gateway-helper";
import {
  post500ErrorResponseBody,
  postDuplicateIDRequestBody,
  postDuplicateIDResponseBody,
  postInvalidStatusRequestBody,
  postInvalidStatusResponseBody,
  postLettersInvalidRequestHeaders,
  postLettersRequestHeaders,
  postValidRequestBody,
} from "./testCases/update-multiple-letter-status";
import {
  createTestData,
  waitForLetterStatus,
} from "../../helpers/generate-fetch-test-data";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("API Gateway Tests to Verify post Status Endpoint", () => {
  test(`post /letters returns 202 and status is updated for multiple letters`, async ({
    request,
  }) => {
    const letterIds: string[] = await createTestData(SUPPLIERID, 4);
    const createdLetters = await Promise.all(
      letterIds.map((id) => waitForLetterStatus(SUPPLIERID, id, "PENDING")),
    );

    const headers = postLettersRequestHeaders();
    const updatesById = {
      [createdLetters[0].id]: { status: "ACCEPTED" },
      [createdLetters[1].id]: {
        status: "REJECTED",
        reasonCode: "R01",
        reasonText: "Test Reason",
      },
      [createdLetters[2].id]: { status: "PRINTED" },
      [createdLetters[3].id]: { status: "CANCELLED" },
    };

    const body = postValidRequestBody(updatesById);

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    expect(response.status()).toBe(202);

    await Promise.all(
      Object.entries(updatesById).map(async ([id, attributes]) => {
        const letter = await waitForLetterStatus(
          SUPPLIERID,
          id,
          attributes.status,
        );
        expect(letter.status).toBe(attributes.status);
      }),
    );
  });

  test(`Post /letters returns 400 if request has invalid status`, async ({
    request,
  }) => {
    const letterIds: string[] = await createTestData(SUPPLIERID, 2);
    const createdLetters = await Promise.all(
      letterIds.map((id) => waitForLetterStatus(SUPPLIERID, id, "PENDING")),
    );

    const headers = postLettersRequestHeaders();
    const body = postInvalidStatusRequestBody(createdLetters);

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(postInvalidStatusResponseBody());
  });

  test(`Post /letters returns 400 if request has duplicate id`, async ({
    request,
  }) => {
    const letterIds: string[] = await createTestData(SUPPLIERID, 2);
    const createdLetters = await Promise.all(
      letterIds.map((id) => waitForLetterStatus(SUPPLIERID, id, "PENDING")),
    );

    const headers = postLettersRequestHeaders();
    const body = postDuplicateIDRequestBody(createdLetters);

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(400);
    expect(responseBody).toMatchObject(postDuplicateIDResponseBody());
  });

  test(`Post /letters returns 500 if request has invalid header`, async ({
    request,
  }) => {
    const letterIds: string[] = await createTestData(SUPPLIERID, 4);
    const createdLetters = await Promise.all(
      letterIds.map((id) => waitForLetterStatus(SUPPLIERID, id, "PENDING")),
    );

    const headers = postLettersInvalidRequestHeaders();
    const body = postValidRequestBody({
      [createdLetters[0].id]: { status: "ACCEPTED" },
      [createdLetters[1].id]: {
        status: "REJECTED",
        reasonCode: "R01",
        reasonText: "Test Reason",
      },
      [createdLetters[2].id]: { status: "PRINTED" },
      [createdLetters[3].id]: { status: "CANCELLED" },
    });

    const response = await request.post(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers,
      data: body,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(500);
    expect(responseBody).toMatchObject(post500ErrorResponseBody());
  });
});
