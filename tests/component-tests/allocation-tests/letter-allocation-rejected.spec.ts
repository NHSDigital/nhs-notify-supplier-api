import { randomUUID } from "node:crypto";
import test, { expect } from "playwright/test";
import {
  PackErrorLog,
  getAllocationLog,
  getAllocationLogForDomainId,
  getVariantsForAllocation,
  getVolumeGroupData,
  updateLetterVariantPackSpecs,
  updateVolumeGroupData,
} from "tests/helpers/allocation-helper";
import { pollQueueForLetterEvent } from "tests/helpers/aws-queue-helper";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { getLettersFromSupplierTable } from "tests/helpers/generate-fetch-test-data";
import { logger } from "tests/helpers/pino-logger";
import { sendSnsEvent } from "tests/helpers/send-sns-event";

test.describe("Allocator Rejected Allocation Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test("Verify that the letters are REJECTED when no pack specification is eligible", async () => {
    const letterVariant = getVariantsForAllocation(1);
    const domainId = `NoEligiblePackSpecs-${randomUUID()}`;
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
      pageCount: 100, // high page count to ensure pack specifications are filtered out based on constraints
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLog<PackErrorLog>(
      "No eligible pack specifications found for letter",
    );

    const allocationLog = await getAllocationLogForDomainId(domainId);
    const lettersInDb = await getLettersFromSupplierTable(
      "unknown",
      domainId,
      "REJECTED",
    );

    expect(lettersInDb.status).toBe("REJECTED");
    expect(lettersInDb.supplierId).toBe(
      allocationLog.msg?.allocationDetails?.supplierSpec?.supplierId,
    );

    const { packSpecificationIds } = supplierAllocatorLog;
    expect(packSpecificationIds).toBeTruthy();
  });

  test("Verify that the letters are placed on a DLQ when no supplier packs are found", async () => {
    const letterVariant = getVariantsForAllocation(6);
    const domainId = `NoSupplierPacksFound-${randomUUID()}`;
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
      pageCount: 2,
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLog<PackErrorLog>(
      "No preferred supplier packs found for pack specification ids and suppliers",
    );

    await pollQueueForLetterEvent("supplier-allocator-dlq", domainId);

    const { packSpecificationIds } = supplierAllocatorLog;
    expect(packSpecificationIds).toBeTruthy();
  });

  test("Verify that the letters are placed on a DLQ when no pack specification found for letter variant", async () => {
    const letterVariant = getVariantsForAllocation(7);
    const domainId = `NoPackSpecificationFound-${randomUUID()}`;

    await updateLetterVariantPackSpecs(letterVariant, [""]);

    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
      pageCount: 2,
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    await getAllocationLog<PackErrorLog>("No pack specification found for id");

    await pollQueueForLetterEvent("supplier-allocator-dlq", domainId);

    await updateLetterVariantPackSpecs(letterVariant, ["notify-c5-colour"]); // update back to valid config for other tests
  });

  for (const { fieldToUpdate, testName, volumeGroupId } of [
    {
      testName:
        "Verify that letters are placed on a DLQ when volumeGroup is not active",
      volumeGroupId: "volumeGroup-test2",
      fieldToUpdate: "startDate",
    },
    {
      testName:
        "Verify that letters are placed on a DLQ when volumeGroup is no longer active",
      volumeGroupId: "volumeGroup-test2",
      fieldToUpdate: "endDate",
    },
  ]) {
    test(testName, async () => {
      const domainId = `${fieldToUpdate}-${randomUUID()}`;
      const letterVariant = getVariantsForAllocation(8);
      logger.info(`Testing volumeGroup with ${fieldToUpdate}: ${domainId}`);

      const volumeGroupData = await getVolumeGroupData(volumeGroupId);
      const originalStartDate = volumeGroupData.startDate;
      const originalEndDate = volumeGroupData.endDate;

      const [futureStartDate] = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T"); // move start date to future
      const [pastEndDate] = new Date(Date.now() - 48 * 60 * 60 * 1000)
        .toISOString()
        .split("T"); // move end date to past

      const targetUpdateDate =
        fieldToUpdate === "startDate" ? futureStartDate : pastEndDate;

      await updateVolumeGroupData(
        volumeGroupId,
        targetUpdateDate,
        fieldToUpdate,
      );

      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
      });

      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();

      await pollQueueForLetterEvent("supplier-allocator-dlq", domainId);

      const resolvedOriginalEndDate =
        originalEndDate ??
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

      await updateVolumeGroupData(
        volumeGroupId,
        fieldToUpdate === "startDate"
          ? originalStartDate
          : resolvedOriginalEndDate,
        fieldToUpdate,
      );
    });
  }
});
