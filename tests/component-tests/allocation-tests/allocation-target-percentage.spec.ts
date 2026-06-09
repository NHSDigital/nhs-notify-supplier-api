import { randomUUID } from "node:crypto";
import test, { expect } from "playwright/test";
import {
  getAllocationLogForDomainId,
  getLetterVariantConfigFromDb,
  getSupplierFromSupplierPack,
  getVariantsForAllocation,
  updateSupplierAllocation,
} from "tests/helpers/allocation-helper";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { getLettersFromSupplierTable } from "tests/helpers/generate-fetch-test-data";
import { sendSnsEvent } from "tests/helpers/send-sns-event";

test.describe("Allocation Target Percentage Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling
  test("Verify that supplier with zero target percentage is handled correctly", async () => {
    const letterVariant = getVariantsForAllocation(8);
    const domainId = `Zero-Percentage-${randomUUID()}`;

    const letterVariantConfig =
      await getLetterVariantConfigFromDb(letterVariant);
    const volGroupId = letterVariantConfig.volumeGroupId;

    // update target percentage
    await updateSupplierAllocation("supplier1", volGroupId, 0);
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
    expect(lettersInDb.reasonCode).toBe("NO_SUPPLIERS_AVAILABLE");
    expect(lettersInDb.reasonText).toBe(
      `No valid supplier allocations found for suppliers with valid pack`,
    );
  });

  test("Verify that supplier with less than 100 target percentage is handled correctly", async () => {
    const letterVariant = getVariantsForAllocation(5);
    const domainId = `Less-Than-100-Percentage-${randomUUID()}`;

    const letterVariantConfig =
      await getLetterVariantConfigFromDb(letterVariant);
    const volGroupId = letterVariantConfig.volumeGroupId;
    const [packSpecificationId] = letterVariantConfig.packSpecificationIds;

    // update target percentage
    const [supplier] = await getSupplierFromSupplierPack(packSpecificationId);

    await updateSupplierAllocation(supplier, volGroupId, 50);
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: letterVariant,
    });

    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();

    const allocationLog = await getAllocationLogForDomainId(domainId);
    const lettersInDb = await getLettersFromSupplierTable(
      allocationLog.msg?.allocationDetails?.supplierSpec?.supplierId!,
      domainId,
      "PENDING",
    );

    expect(lettersInDb.supplierId).toBe(
      allocationLog.msg?.allocationDetails?.supplierSpec?.supplierId,
    );
    await updateSupplierAllocation(supplier, volGroupId, 100); // reset target percentage to avoid impact on other tests
  });
});
