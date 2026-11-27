import { expect, test } from "@playwright/test";
import { pollSupplierAllocatorForAllocationDetails } from "tests/helpers/aws-cloudwatch-helper";
import { logger } from "tests/helpers/pino-logger";
import { randomUUID } from "node:crypto";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { sendSnsBatchEvent } from "tests/helpers/send-sns-event";
import { pollQueueForLetterEvent } from "tests/helpers/aws-queue-helper";

test.describe("Supplier Allocation Tests", () => {
  test("Verify that successful supplier allocation emits a PENDING event for the allocated supplier", async () => {
    test.setTimeout(180_000); // 3 minutes for long running polling
    const domainId = randomUUID();
    logger.info(`Testing supplier allocation with domainId: ${domainId}`);
    const preparedEvent = createPreparedV1Event({ domainId });
    const response = await sendSnsBatchEvent([
      { id: preparedEvent.id, message: preparedEvent },
    ]);
    expect(response.Successful).toHaveLength(1);

    // poll supplier allocator to check if supplier has been allocated
    const allocationDetails =
      await pollSupplierAllocatorForAllocationDetails(domainId);

    const supplierId = allocationDetails?.supplierSpec?.supplierId;

    const status = allocationDetails?.allocationStatus?.status;

    expect(supplierId).toBeTruthy();
    expect(status).toBe("PENDING");

    logger.info(
      `Supplier ${supplierId} allocated with status ${status} for domainId ${domainId} in supplier allocator lambda`,
    );
  });

  test("Verify that supplier allocator places the event on a DLQ for an unknown letter variant", async () => {
    test.setTimeout(180_000); // 3 minutes for long running polling
    const domainId = randomUUID();
    logger.info(
      `Testing supplier allocation with unknown letter variant for domainId: ${domainId}`,
    );
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: "unknown-letter-variant",
    });
    const response = await sendSnsBatchEvent([
      { id: preparedEvent.id, message: preparedEvent },
    ]);
    expect(response.Successful).toHaveLength(1);

    await pollQueueForLetterEvent("supplier-allocator-dlq", domainId);
  });
});
