import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  FetchedSupplierLog,
  getAllocationDetailsForDomainId,
  getVariantsForAllocation,
} from "tests/helpers/allocation-helper";

import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { sendSnsEvent } from "tests/helpers/send-sns-event";

test.describe("Letter Variant Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test("Verify that supplierId on letter variant takes pecedence over volume group", async () => {
    const letterVariant = getVariantsForAllocation(3);
    const domainId = randomUUID();
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
    });

    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    const allocationDetails: FetchedSupplierLog =
      await getAllocationDetailsForDomainId(domainId);

    expect(allocationDetails.allocatedSuppliers).toHaveLength(1);

    const allocatedSupplierId = allocationDetails.allocatedSuppliers?.[0]?.id;
    expect(allocatedSupplierId).toBe("supplier1");
  });
});
