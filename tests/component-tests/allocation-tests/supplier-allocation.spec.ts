import { expect, test } from "@playwright/test";
import {
  getTotalAllocationForVolumeGroup,
  getTotalDailyAllocation,
} from "tests/helpers/supplier-quotas-helper";
import {
  pollSupplierAllocatorForAllocationDetails,
  supplierIdFromSupplierAllocatorLog,
} from "tests/helpers/aws-cloudwatch-helper";
import { logger } from "tests/helpers/pino-logger";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { randomUUID } from "node:crypto";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { sendSnsBatchEvent } from "tests/helpers/send-sns-event";

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

  test("Verify that supplier allocator emits a rejected request for an unknown letter variant", async () => {
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
    const allocationDetails =
      await pollSupplierAllocatorForAllocationDetails(domainId);

    const supplierId = allocationDetails?.supplierSpec?.supplierId;

    const status = allocationDetails?.allocationStatus?.status;

    expect(supplierId).toBe("unknown");
    expect(status).toBe("REJECTED");
  });

  test("Verify that supplier allocations are correctly updated only once for a volume group for multiple messages", async () => {
    test.setTimeout(180_000);
    const volumeGroupId = "volumeGroup-test1";
    const originalTotalAllocation =
      await getTotalAllocationForVolumeGroup(volumeGroupId);
    logger.info(
      `Total allocation for volume group ${volumeGroupId}: ${originalTotalAllocation}`,
    );

    const allocationDate = format(
      toZonedTime(new Date(), "Europe/London"),
      "yyyy-MM-dd",
    );
    const originalTotalDailyAllocation =
      await getTotalDailyAllocation(allocationDate);
    logger.info(
      `Total daily allocation for date ${allocationDate}: ${originalTotalDailyAllocation}`,
    );

    // Create 2 messages with same domain id
    const domainId = randomUUID();

    const message1 = createPreparedV1Event({
      domainId,
      letterVariantId: "notify-standard-test1",
    });
    const message2 = createPreparedV1Event({
      domainId,
      letterVariantId: "notify-standard-test1",
    });

    const eventBatch = [message1, message2];
    const response = await sendSnsBatchEvent(
      eventBatch.map((event) => ({ id: event.id, message: event })),
    );
    expect(response.Successful).toHaveLength(eventBatch.length);

    await supplierIdFromSupplierAllocatorLog(domainId);

    const newTotalAllocation =
      await getTotalAllocationForVolumeGroup(volumeGroupId);
    logger.info(
      `New total allocation for volume group ${volumeGroupId}: ${newTotalAllocation}`,
    );
    expect(newTotalAllocation).toBe(originalTotalAllocation + 1);

    const newTotalDailyAllocation =
      await getTotalDailyAllocation(allocationDate);
    logger.info(
      `New total daily allocation for date ${allocationDate}: ${newTotalDailyAllocation}`,
    );
    expect(newTotalDailyAllocation).toBe(originalTotalDailyAllocation + 1);
  });
});
