import { randomUUID } from "node:crypto";
import test, { expect } from "playwright/test";
import {
  PackErrorLog,
  VolumeGroupInactiveTestCase,
  getAllocationLog,
  getAllocationLogForDomainId,
  getVariantsForAllocation,
  updateVolumeGroupData,
} from "tests/helpers/allocation-helper";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { getLettersFromSupplierTable } from "tests/helpers/generate-fetch-test-data";
import { logger } from "tests/helpers/pino-logger";
import { sendSnsEvent } from "tests/helpers/send-sns-event";

test.describe("Allocator Rejected Allocation Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling
  test("Verify that unknown letter variant is marked as rejected allocation", async () => {
    const domainId = `unknown-variant-${randomUUID()}`;
    logger.info(`Testing rejected allocation with domainId: ${domainId}`);

    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: `unknown-variant-${domainId}`,
    });

    const response = await sendSnsEvent(preparedEvent);

    expect(response.MessageId).toBeTruthy();

    const supplierAllocatorLog = await getAllocationLogForDomainId(domainId);
    const supplierId =
      supplierAllocatorLog.msg?.allocationDetails?.supplierSpec?.supplierId;
    const allocationStatus =
      supplierAllocatorLog.msg?.allocationDetails?.allocationStatus?.status;
    const reasonCode =
      supplierAllocatorLog.msg?.allocationDetails?.allocationStatus?.reasonCode;

    expect(supplierId).toBe("unknown");
    expect(allocationStatus).toBe("REJECTED");
    expect(reasonCode).toBe("NO_SUPPLIERS_AVAILABLE");

    const lettersInDb = await getLettersFromSupplierTable(
      supplierId!,
      domainId,
      "REJECTED",
    );
    expect(lettersInDb).toBeTruthy();
    expect(lettersInDb.status).toBe(allocationStatus);
    expect(lettersInDb.reasonCode).toBe(reasonCode);
    expect(lettersInDb.reasonText).toBe(
      `No letter variant details found for id unknown-variant-${domainId}`,
    );
  });

  for (const {
    domainIdName,
    expectedError,
    letterVariantMapping,
    pageCount,
    testCase,
    testName,
  } of [
    {
      testCase: 1,
      testName:
        "Verify that the letters are REJECTED when no pack specification is eligible",
      letterVariantMapping: 1,
      domainIdName: "NoEligiblePackSpecs",
      pageCount: 100, // high page count to ensure pack specifications are filtered out based on constraints
      expectedError: "No eligible pack specifications found for letter",
    },
    {
      testCase: 2,
      testName:
        "Verify that the letters are REJECTED when no supplier pack are found for selected pack",
      letterVariantMapping: 6,
      domainIdName: "NoSupplierPacksFound",
      pageCount: 2,
      expectedError:
        "No preferred supplier packs found for pack specification ids and suppliers",
    },
    {
      testCase: 3,
      testName:
        "Verify that the letters are REJECTED when no pack specification found for letter variant",
      letterVariantMapping: 7,
      domainIdName: "NoPackSpecificationFound",
      pageCount: 2,
      expectedError: "No pack specification found for id",
    },
  ]) {
    test(testName, async () => {
      const letterVariant = getVariantsForAllocation(letterVariantMapping);
      const domainId = `${domainIdName}-${randomUUID()}`;
      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
        pageCount,
      });

      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();

      const supplierAllocatorLog =
        await getAllocationLog<PackErrorLog>(expectedError);

      const { packSpecificationIds } = supplierAllocatorLog;
      expect(packSpecificationIds).toBeTruthy();

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
      switch (testCase) {
        case 1: {
          expect(lettersInDb.reasonText).toBe(
            `No eligible pack specifications found for letter variant id ${letterVariant} and pack specification ids ${packSpecificationIds?.join(", ")}`,
          );
          break;
        }
        case 2: {
          expect(lettersInDb.reasonText).toContain(
            `No preferred supplier packs found for pack specification ids ${packSpecificationIds?.join(", ")} and suppliers`,
          );
          break;
        }
        case 3: {
          expect(lettersInDb.reasonText).toBe(
            `No pack specification found for id`,
          );
          break;
        }
        default: {
          throw new Error(`Unexpected test case ${testCase}`);
        }
      }
    });
  }

  const volumeGroupInactiveTestCases: VolumeGroupInactiveTestCase[] = [
    {
      testName:
        "Verify that letters are rejected when volumeGroup is not active",
      volumeGroupId: "volumeGroup-test2",
      fieldToUpdate: "startDate",
      daysInFuture: 1,
    },
    {
      testName:
        "Verify that letters are rejected when volumeGroup is no longer active",
      volumeGroupId: "volumeGroup-test2",
      fieldToUpdate: "endDate",
      daysInFuture: -1,
    },
  ];

  for (const {
    daysInFuture,
    fieldToUpdate,
    testName,
    volumeGroupId,
  } of volumeGroupInactiveTestCases) {
    test(testName, async () => {
      const domainId = `${fieldToUpdate}-${randomUUID()}`;
      const letterVariant = getVariantsForAllocation(8);
      logger.info(`Testing volumeGroup with futureDate: ${domainId}`);

      // set volume group date to future date
      await updateVolumeGroupData(volumeGroupId, daysInFuture, fieldToUpdate);

      const preparedEvent = createPreparedV1Event({
        domainId,
        letterVariantId: letterVariant,
      });

      const response = await sendSnsEvent(preparedEvent);
      expect(response.MessageId).toBeTruthy();

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
      expect(lettersInDb.reasonText).toContain(
        `Volume group with id ${volumeGroupId} is not active`,
      );
      // update back to current date
      await updateVolumeGroupData(volumeGroupId, 0, fieldToUpdate);
    });
  }
});
