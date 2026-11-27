import {
  AllocatedLetter,
  AllocatedLetterSchema,
} from "nhs-notify-supplier-api-upsert-letter/src/handler/schemas";
import { randomUUID } from "node:crypto";
import { expect } from "playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { VISIBILITY_TIMEOUT_SECONDS } from "tests/constants/api-constants";
import { pollSupplierAllocatorLogForResolvedSpec } from "./aws-cloudwatch-helper";
import { createPreparedV1Event } from "./event-fixtures";
import {
  getLettersWithRetry,
  isGetLettersResponse,
} from "./generate-fetch-test-data";
import { logger } from "./pino-logger";
import { sendSnsEvent } from "./send-sns-event";

const GET_ALL_EXPECTED_LETTERS_MAX_ATTEMPTS = 6;

// Values for CI/CD are kept in group_nhs-notify-supplier-api-dev.tfvars in the nhs-notify-internal repo
// If running locally see default of variant_map in infrastructure/terraform/components/api/variables.tf
// Priority as stored on the letter queue: a lower number is more urgent and is returned first.
export const variantPriorityMap: Record<string, number> = {
  "client1-campaign1": 0,
  "client1-campaign2": 1,
  "client1-campaign3": 2,
  "client1-campaign4": 3,
  "client1-campaign5": 4,
  "client1-campaign6": 5,
  "client1-campaign7": 6,
  "client1-campaign8": 7,
  "gpreg-admail": 8,
  "client3-abnormal-results": 9,
  "client3-abnormal-results-braille": 10,
  "client3-invites": 10,
  "client3-invites-braille": 10,
  "client3-standard": 11,
  "client3-standard-braille": 12,
  "notify-braille": 13,
  "notify-digital-letters-standard": 97,
  "notify-standard": 98,
  "notify-standard-colour": 99,
};
export const supplier = "supplier1";

export function getVariantsWithPriority(priority: number) {
  const variants = Object.keys(variantPriorityMap).filter(
    // safe as comes from map's keys which are controlled by us
    // eslint-disable-next-line security/detect-object-injection
    (variant) => variantPriorityMap[variant] === priority,
  );
  if (variants.length === 0) {
    throw new Error(`No variants found with priority ${priority}`);
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

type LettersWithPriority = { priority: number; letterIds: string[] };

function indexesOf(letterIds: string[], ids: string[]) {
  return ids.map((id) => letterIds.indexOf(id));
}

export function verifyMoreUrgentLettersReturnedFirst(
  letterIds: string[],
  moreUrgent: LettersWithPriority,
  lessUrgent: LettersWithPriority,
) {
  expect(moreUrgent.priority).toBeLessThan(lessUrgent.priority);

  const moreUrgentIndexes = indexesOf(letterIds, moreUrgent.letterIds);
  const lessUrgentIndexes = indexesOf(letterIds, lessUrgent.letterIds);
  expect(moreUrgentIndexes).not.toContain(-1);
  expect(lessUrgentIndexes).not.toContain(-1);

  const lastMoreUrgentIndex = Math.max(...moreUrgentIndexes);
  const firstLessUrgentIndex = Math.min(...lessUrgentIndexes);
  expect(lastMoreUrgentIndex).toBeLessThan(firstLessUrgentIndex);
  logger.info(
    `Verified priority ${moreUrgent.priority} letters are returned before priority ${lessUrgent.priority} letters: last priority ${moreUrgent.priority} letter at index ${lastMoreUrgentIndex}, first priority ${lessUrgent.priority} letter at index ${firstLessUrgentIndex}`,
  );
}

// GET /letters hides returned letters for the visibility timeout, and anything else reading supplier1's queue
// (a retried test, e2e tests, a local run) can hide some of our letters from one response. Ordering can only be checked within a single response,
// so retry until one response holds all of them.
export async function getLetterIdsContainingAll(
  request: APIRequestContext,
  baseUrl: string,
  headers: Record<string, string>,
  expectedIds: string[],
): Promise<string[]> {
  let missingIds: string[] = expectedIds;
  for (
    let attempt = 1;
    attempt <= GET_ALL_EXPECTED_LETTERS_MAX_ATTEMPTS;
    attempt++
  ) {
    const { responseBody, statusCode } = await getLettersWithRetry(
      request,
      baseUrl,
      headers,
    );
    expect(statusCode).toBe(200);
    if (!isGetLettersResponse(responseBody)) {
      throw new Error("Expected GetLettersResponse body for 200 status");
    }

    const letterIds = responseBody.data.map((letter) => letter.id);
    missingIds = expectedIds.filter((id) => !letterIds.includes(id));
    if (missingIds.length === 0) {
      return letterIds;
    }

    logger.info(
      `Attempt ${attempt}: GET /letters returned ${letterIds.length} letters, missing ${JSON.stringify(missingIds)}`,
    );
    await new Promise((resolve) => {
      setTimeout(resolve, VISIBILITY_TIMEOUT_SECONDS * 1000);
    });
  }

  throw new Error(
    `GET /letters never returned all expected letters in one response; missing ${JSON.stringify(missingIds)}`,
  );
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
    const { allocationDetails } = allocatedLetter;
    expect(allocationDetails).toBeDefined();
    expect(allocationDetails.supplierSpec.priority).toBeDefined();
    expect(allocationDetails.supplierSpec.priority).toBe(priority);
    logger.info(
      `Verified log for domainId ${domainId} contains priority ${priority}`,
    );
  }
}
