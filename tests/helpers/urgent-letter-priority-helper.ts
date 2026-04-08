import {
  AllocatedLetter,
  AllocatedLetterSchema,
} from "nhs-notify-supplier-api-upsert-letter/src/handler/schemas";
import { randomUUID } from "node:crypto";
import { expect } from "playwright/test";
import { pollSupplierAllocatorLogForResolvedSpec } from "./aws-cloudwatch-helper";
import { createPreparedV1Event } from "./event-fixtures";
import { logger } from "./pino-logger";
import { sendSnsEvent } from "./send-sns-event";

// Values for CI/CD are kept in group_nhs-notify-supplier-api-dev.tfvars in the nhs-notify-internal repo
// If running locally see default of variant_map in infrastructure/terraform/components/api/variables.tf
export const variantUrgencyMap: Record<string, number> = {
  "digitrials-aspiring": 0,
  "digitrials-dmapp": 1,
  "digitrials-globalminds": 2,
  "digitrials-mymelanoma": 3,
  "digitrials-ofh": 4,
  "digitrials-prostateprogress": 5,
  "digitrials-protectc": 6,
  "digitrials-restore": 7,
  "gpreg-admail": 8,
  "nces-abnormal-results": 9,
  "nces-abnormal-results-braille": 10,
  "nces-invites": 10,
  "nces-invites-braille": 10,
  "nces-standard": 11,
  "nces-standard-braille": 12,
  "notify-braille": 13,
  "notify-digital-letters-standard": 97,
  "notify-standard": 98,
  "notify-standard-colour": 99,
};
export const supplier = "supplier1";

export function getVariantsWithUrgency(urgency: number) {
  const variants = Object.keys(variantUrgencyMap).filter(
    // safe as comes from map's keys which are controlled by us
    // eslint-disable-next-line security/detect-object-injection
    (variant) => variantUrgencyMap[variant] === urgency,
  );
  if (variants.length === 0) {
    throw new Error(`No variants found with urgency ${urgency}`);
  }
  return variants;
}

export async function sendEventsForVariants(variants: string[]) {
  const domainIds: string[] = [];
  for (const variant of variants) {
    const domainId = randomUUID();
    logger.info(
      `Testing event subscription with domainId: ${domainId} and variant: ${variant}`,
    );
    const preparedEvent = createPreparedV1Event({
      domainId,
      letterVariantId: variant,
    });
    const response = await sendSnsEvent(preparedEvent);
    expect(response.MessageId).toBeTruthy();
    domainIds.push(domainId);
  }
  return domainIds;
}

export function verifyIndexPositionOfLetterVariants(
  letterIds: string[],
  letterIdsLowerUrgency: string[],
  letterIdsHigherUrgency: string[],
) {
  expect(
    letterIdsLowerUrgency.every((id) => letterIds.includes(id)),
  ).toBeTruthy();
  expect(
    letterIdsHigherUrgency.every((id) => letterIds.includes(id)),
  ).toBeTruthy();

  const indexById = new Map<string, number>();
  for (const [i, letterId] of letterIds.entries()) {
    indexById.set(letterId, i);
  }

  let highestUrgencyMaxIndex = -1;
  for (const id of letterIdsHigherUrgency) {
    const idx = indexById.get(id)!;
    if (idx > highestUrgencyMaxIndex) highestUrgencyMaxIndex = idx;
  }

  let lowerUrgencyMinIndex = Number.POSITIVE_INFINITY;
  for (const id of letterIdsLowerUrgency) {
    const idx = indexById.get(id)!;
    if (idx < lowerUrgencyMinIndex) lowerUrgencyMinIndex = idx;
  }

  // All higher-urgency letters must appear before any lower-urgency letter
  expect(highestUrgencyMaxIndex).toBeLessThan(lowerUrgencyMinIndex);
}

export async function verifyAllocationLogsContainPriority(
  letterIds: string[],
  priority: number,
) {
  for (const domainId of letterIds) {
    const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
    const supplierAllocatorLog = JSON.parse(message);
    const allocatedLetter: AllocatedLetter = AllocatedLetterSchema.parse(
      supplierAllocatorLog.msg,
    );
    const { supplierSpec } = allocatedLetter;
    expect(supplierSpec).toBeDefined();
    expect(supplierSpec.priority).toBeDefined();
    expect(supplierSpec.priority).toBe(priority);
  }
}
