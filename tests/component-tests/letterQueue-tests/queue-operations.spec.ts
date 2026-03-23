import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  createPreparedEventBatchWithSameDomainId,
  createPreparedV1Event,
} from "tests/helpers/event-fixtures";
import { logger } from "tests/helpers/pino-logger";
import { sendSnsBatchEvent, sendSnsEvent } from "tests/helpers/send-sns-event";
import { supplierIdFromSupplierAllocatorLog } from "tests/helpers/aws-cloudwatch-helper";
import getRestApiGatewayBaseUrl from "tests/helpers/aws-gateway-helper";
import { SUPPLIER_LETTERS } from "tests/constants/api-constants";
import { supplierDataSetup } from "tests/helpers/suppliers-setup-helper";
import { checkLetterQueueTable } from "tests/helpers/generate-fetch-test-data";
import {
  patchRequestHeaders,
  patchValidRequestBody,
} from "../apiGateway-tests/testCases/update-letter-status";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("Letter Queue Tests", () => {
  test.setTimeout(180_000);

  test("Verify that the letter queue operation inserts data into the letter queue table for pending letters", async ({
    request,
  }) => {
    const letterId = randomUUID();
    const status = "ACCEPTED";

    logger.info(`Sending event with domainId: ${letterId}`);
    const preparedEvent = createPreparedV1Event({ domainId: letterId });
    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    const supplierId = await supplierIdFromSupplierAllocatorLog(letterId);

    await supplierDataSetup(supplierId);

    const [letterQueue, count] = await checkLetterQueueTable(
      supplierId,
      letterId,
    );
    expect(letterQueue).toBe(true);
    expect(count).toBe(1);

    // update the letter status to ACCEPTED and verify if letter queue table is cleaned up

    const headers = patchRequestHeaders(supplierId);
    const body = patchValidRequestBody(letterId, status);

    const patchResponse = await request.patch(
      `${baseUrl}/${SUPPLIER_LETTERS}/${letterId}`,
      {
        headers,
        data: body,
      },
    );
    expect(patchResponse.status()).toBe(202);
    logger.info(
      `Updated letter status to ${status} for letterId ${letterId}, now polling letter queue table for cleanup confirmation`,
    );

    const [letterQueueAfterUpdate, countAfterUpdate] =
      await checkLetterQueueTable(supplierId, letterId, true);
    expect(letterQueueAfterUpdate).toBe(true);
    expect(countAfterUpdate).toBeUndefined();
  });

  test("Verify if the only one entry is inserted in the letter queue table for a batch of events with the same letterId", async () => {
    const letterId = randomUUID();
    const eventBatch = createPreparedEventBatchWithSameDomainId({
      domainId: letterId,
    });
    logger.info(
      `Sending batch event with ${eventBatch.length} events ${letterId}`,
    );
    const response = await sendSnsBatchEvent(
      eventBatch.map((event) => ({
        id: event.id,
        message: event,
      })),
    );
    expect(response.Successful).toBeTruthy();

    const supplierId = await supplierIdFromSupplierAllocatorLog(letterId);

    logger.info(
      `Verifying if only one entry is inserted in the letter queue table for the batch of events with same letterId ${letterId}`,
    );
    const [letterExists, itemCount] = await checkLetterQueueTable(
      supplierId,
      letterId,
    );
    expect(letterExists).toBe(true);
    expect(itemCount).toBe(1);
  });
});
