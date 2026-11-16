import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  FetchedSupplierLog,
  deleteTestLetterVariant,
  getAllocationDetailsForDomainId,
  getAllocationLog,
  getVariantsForAllocation,
  seedTestLetterVariant,
} from "tests/helpers/allocation-helper";

import { pollQueueForLetterEvent } from "tests/helpers/aws-queue-helper";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { sendSnsEvent } from "tests/helpers/send-sns-event";

test.describe("Letter Variant Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  for (const status of ["DRAFT", "INT", "DISABLED"] as const) {
    test(`Verify that letter variant status ${status} sends the letter to the DLQ`, async () => {
      const domainId = randomUUID();
      const variantId = `inactive-variant-${status}-${randomUUID()}`;
      await seedTestLetterVariant(
        getVariantsForAllocation(1),
        variantId,
        status,
      );

      try {
        const startTimeMs = Date.now();
        const preparedEvent = createPreparedV1Event({
          domainId,
          letterVariantId: variantId,
        });
        const response = await sendSnsEvent(preparedEvent);
        expect(response.MessageId).toBeTruthy();

        const inactiveVariantLog = await getAllocationLog<{
          description: string;
          logRef: string;
          variantId: string;
          status: string;
        }>("Letter variant is not active based on status", {
          startTimeMs,
          extraPatterns: [variantId],
        });
        expect(inactiveVariantLog).toMatchObject({
          logRef: "027-INACTIVE-LETTER-VARIANT",
          variantId,
          status,
        });

        await pollQueueForLetterEvent("supplier-allocator-dlq", domainId);
      } finally {
        await deleteTestLetterVariant(variantId);
      }
    });
  }

  test("Verify that supplierId on letter variant takes precedence over volume group", async () => {
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
