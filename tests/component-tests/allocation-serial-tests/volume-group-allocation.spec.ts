import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  getTotalAllocationForVolumeGroup,
  getTotalDailyAllocation,
} from "tests/helpers/supplier-quotas-helper";
import { supplierIdFromSupplierAllocatorLog } from "tests/helpers/aws-cloudwatch-helper";
import { getAllocationDate } from "tests/helpers/allocation-helper";
import { logger } from "tests/helpers/pino-logger";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { sendSnsBatchEvent } from "tests/helpers/send-sns-event";

// Asserts exact totals for volumeGroup-test1, so it must run in the serial project
// after every other spec that allocates notify-standard-test1/notify-standard-colour letters
test.describe("Volume Group Allocation Tests", () => {
  test("Verify that supplier allocations are correctly updated only once for a volume group for multiple messages", async () => {
    test.setTimeout(180_000);
    const volumeGroupId = "volumeGroup-test1";
    const originalTotalAllocation =
      await getTotalAllocationForVolumeGroup(volumeGroupId);
    logger.info(
      `Total allocation for volume group ${volumeGroupId}: ${originalTotalAllocation}`,
    );

    const allocationDate = getAllocationDate();
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

    // allocations are persisted at the end of the allocator batch, after the log line we waited for
    await expect
      .poll(() => getTotalAllocationForVolumeGroup(volumeGroupId), {
        timeout: 30_000,
      })
      .toBeGreaterThanOrEqual(originalTotalAllocation + 1);
    // give a duplicate that was processed in another batch time to (wrongly) increment again
    await new Promise((resolve) => {
      setTimeout(resolve, 10_000);
    });

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
    expect(newTotalDailyAllocation).toBeGreaterThanOrEqual(
      originalTotalDailyAllocation + 1,
    );
  });
});
