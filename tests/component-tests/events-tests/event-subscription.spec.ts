import { expect, test } from "@playwright/test";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import { sendSqsEvent } from "tests/helpers/send-sqs-event";
import {
  createPendingAllocatedEvent,
  createPreparedV1Event,
} from "tests/helpers/event-fixtures";
import { randomUUID } from "node:crypto";
import { logger } from "tests/helpers/pino-logger";
import { createValidRequestHeaders } from "tests/constants/request-headers";
import getRestApiGatewayBaseUrl from "tests/helpers/aws-gateway-helper";
import { SUPPLIER_LETTERS, envName } from "tests/constants/api-constants";
import {
  pollSupplierAllocatorLogForError,
  pollSupplierAllocatorLogForResolvedSpec,
  pollUpsertLetterLogForWarning,
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
      msg?: { allocationDetails?: { supplierSpec?: { supplierId?: string } } };
    };
    const supplierId =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;

    logger.info(
      `Supplier ${supplierId} allocated to letter ${domainId} in supplier allocator lambda`,
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

    // poll supplier allocator to check for error log for cancelled status
    await pollSupplierAllocatorLogForError(
      "Message did not match an expected schema",
      domainId,
    );

    const headers = createValidRequestHeaders();

    const getLetterResponse = await request.get(
      `${baseUrl}/${SUPPLIER_LETTERS}/${domainId}`,
      {
        headers,
      },
    );
    expect(getLetterResponse.status()).toBe(404);
  });
  test("Verify that an error is logged for duplicates sent on the sqs queue", async () => {
    const domainId = randomUUID();
    logger.info(`Testing event subscription with domainId: ${domainId}`);
    const pendingEvent = createPendingAllocatedEvent({ domainId });
    await sendSqsEvent(JSON.stringify(pendingEvent));
    const pendingEventDuplicate = createPendingAllocatedEvent({ domainId });
    await sendSqsEvent(JSON.stringify(pendingEventDuplicate));

    await pollUpsertLetterLogForWarning("Letter already exists", domainId);
  });
});
