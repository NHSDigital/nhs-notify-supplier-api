import { expect, test } from "@playwright/test";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { randomUUID } from "node:crypto";
import { logger } from "tests/helpers/pino-logger";
import { createValidRequestHeaders } from "tests/constants/request-headers";
import getRestApiGatewayBaseUrl from "tests/helpers/aws-gateway-helper";
import { SUPPLIER_LETTERS, envName } from "tests/constants/api-constants";
import {
  pollSupplierAllocatorLogForResolvedSpec,
  pollUpsertLetterLogForError,
} from "tests/helpers/aws-cloudwatch-helper";
import { supplierDataSetup } from "tests/helpers/suppliers-setup-helper";
import { pollForLetterStatus } from "tests/helpers/poll-for-letters-helper";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("Event Subscription SNS Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling
  test(`Verify that the publish event to nhs-${envName}-supapi-eventsub topic inserts data into db`, async ({
    request,
  }) => {
    const domainId = randomUUID();
    logger.info(`Testing event subscription with domainId: ${domainId}`);
    const preparedEvent = createPreparedV1Event({ domainId });
    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    // poll supplier allocator to check if supplier has been allocated
    const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
    const supplierAllocatorLog = JSON.parse(message) as {
      msg?: { supplierSpec?: { supplierId?: string } };
    };
    const supplierId = supplierAllocatorLog.msg?.supplierSpec?.supplierId;

    logger.info(
      `Supplier ${supplierId} allocated for domainId ${domainId} in supplier allocator lambda`,
    );
    if (!supplierId) {
      throw new Error("supplierId was not found in supplier allocator log");
    }

    // check if supplier exists in suppliers table
    await supplierDataSetup(supplierId);

    // poll for letter to be inserted in db with status PENDING
    const { letterStatus, statusCode } = await pollForLetterStatus(
      request,
      supplierId,
      domainId,
      baseUrl,
    );

    expect(statusCode).toBe(200);
    expect(letterStatus).toBe("PENDING");
  });

  test("Verify that the publish event with 'CANCELLED' status throws error", async ({
    request,
  }) => {
    const domainId = randomUUID();
    logger.info(`Testing event subscription with domainId: ${domainId}`);
    const preparedEvent = createPreparedV1Event({
      domainId,
      status: "CANCELLED",
    });
    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    // poll supplier allocator to check if supplier has been allocated
    const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
    const supplierAllocatorLog = JSON.parse(message) as {
      msg?: { supplierSpec?: { supplierId?: string } };
    };
    const supplierId = supplierAllocatorLog.msg?.supplierSpec?.supplierId;

    logger.info(
      `Supplier ${supplierId} allocated for domainId ${domainId} in supplier allocator lambda`,
    );
    if (!supplierId) {
      throw new Error("supplierId was not found in supplier allocator log");
    }

    const headers = createValidRequestHeaders(supplierId);

    const getLetterResponse = await request.get(
      `${baseUrl}/${SUPPLIER_LETTERS}/${domainId}`,
      {
        headers,
      },
    );

    expect(getLetterResponse.status()).toBe(500);
    await pollUpsertLetterLogForError(
      "Message did not match an expected schema",
      domainId,
    );
  });

  test("Verify that the duplicate event throws an error", async () => {
    const domainId = randomUUID();
    logger.info(`Testing event subscription with domainId: ${domainId}`);
    const preparedEvent = createPreparedV1Event({
      domainId,
      status: "PREPARED",
    });
    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    // poll supplier allocator to check if supplier has been allocated
    const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
    const supplierAllocatorLog = JSON.parse(message) as {
      msg?: { supplierSpec?: { supplierId?: string } };
    };
    const supplierId = supplierAllocatorLog.msg?.supplierSpec?.supplierId;

    logger.info(
      `Supplier ${supplierId} allocated for domainId ${domainId} in supplier allocator lambda`,
    );
    if (!supplierId) {
      throw new Error("supplierId was not found in supplier allocator log");
    }

    // send same event again to simulate duplicate event
    const duplicateResponse = await sendSnsEvent(preparedEvent);
    expect(duplicateResponse.MessageId).toBeTruthy();

    // poll supplier upsert to check if duplicate event was processed
    await pollUpsertLetterLogForError(
      `Letter with id ${domainId} already exists for supplier ${supplierId}"`,
    );
  });
});
