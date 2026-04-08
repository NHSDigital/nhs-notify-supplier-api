import { expect, test } from "@playwright/test";
import { sendSnsEvent } from "tests/helpers/send-sns-event";
import { createPreparedV1Event } from "tests/helpers/event-fixtures";
import { randomUUID } from "node:crypto";
import { logger } from "tests/helpers/pino-logger";
// import { createValidRequestHeaders } from "tests/constants/request-headers";
import getRestApiGatewayBaseUrl from "tests/helpers/aws-gateway-helper";
// import { SUPPLIER_LETTERS } from "tests/constants/api-constants";
import { pollForLetterStatus } from "tests/helpers/poll-for-letters-helper";
import { pollSupplierAllocatorLogForResolvedSpec } from "tests/helpers/aws-cloudwatch-helper";
import { getLettersFromQueueViaIndex } from "tests/helpers/generate-fetch-test-data";
// import {
//   GetLettersResponse,
//   GetLettersResponseSchema,
// } from "../../../lambdas/api-handler/src/contracts/letters";
import {
  AllocatedLetter,
  AllocatedLetterSchema,
} from "../../../lambdas/upsert-letter/src/handler/schemas";

// Values for CI/CD are kept in group_nhs-notify-supplier-api-dev.tfvars in the nhs-notify-internal repo
// If running locally see default of variant_map in infrastructure/terraform/components/api/variables.tf
const variantUrgencyMap: Record<string, number> = {
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
const supplier = "supplier1";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("Urgent Letter Priority Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test("Letter with higher urgency gets picked first", async ({ request }) => {
    const variantsUrgencyNine = getVariantsWithUrgency(9);
    const urgencyNineLetterIds =
      await sendEventsForVariants(variantsUrgencyNine);
    const variantsUrgencyTen = getVariantsWithUrgency(10);
    const urgencyTenLetterIds = await sendEventsForVariants(variantsUrgencyTen);

    await Promise.all(
      [...urgencyNineLetterIds, ...urgencyTenLetterIds].map(async (domainId) =>
        pollForLetterStatus(request, supplier, domainId, baseUrl),
      ),
    );

    await verifyAllocationLogsContainPriority(urgencyNineLetterIds, 9);
    await verifyAllocationLogsContainPriority(urgencyTenLetterIds, 10);

    const lettersFromQueue = await getLettersFromQueueViaIndex(supplier);
    const letterIdsFromQueue = lettersFromQueue.map(
      (letter) => letter.letterId,
    );

    verifyIndexPositionOfLetterVariants(
      letterIdsFromQueue,
      urgencyNineLetterIds,
      urgencyTenLetterIds,
    );

    // TODO: CCM-15185 should call the endpoint directly to verify the order of letters
    // const header = createValidRequestHeaders(supplier);
    // const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
    //   headers: header,
    // });

    // expect(response.status()).toBe(200);
    // const responseBody = await response.json();
    // expect(responseBody.data.length).toBeGreaterThanOrEqual(1);

    // const getLettersResponse: GetLettersResponse =
    //   GetLettersResponseSchema.parse(responseBody);

    // const letterIds = getLettersResponse.data.map((letter) => letter.id);

    // verifyIndexPositionOfLetterVariants(
    //   getLettersResponse,
    //   urgencyNineLetterIds,
    //   urgencyTenLetterIds,
    // );
  });
});

function getVariantsWithUrgency(urgency: number) {
  const variants = Object.keys(variantUrgencyMap).filter(
    // safe has comes from map's keys which are controlled by us
    // eslint-disable-next-line security/detect-object-injection
    (variant) => variantUrgencyMap[variant] === urgency,
  );
  if (variants.length === 0) {
    throw new Error(`No variants found with urgency ${urgency}`);
  }
  return variants;
}

async function sendEventsForVariants(variants: string[]) {
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

function verifyIndexPositionOfLetterVariants(
  letterIds: string[],
  letterIdsLeastUrgency: string[],
  letterIdsHigherUrgency: string[],
) {
  for (const leastUrgencyLetterId of letterIdsLeastUrgency) {
    expect(letterIds).toContain(leastUrgencyLetterId); // in case limit param is hit
    const indexToTest = letterIds.indexOf(leastUrgencyLetterId);
    for (const higherUrgencyLetterId of letterIdsHigherUrgency) {
      expect(letterIds).toContain(higherUrgencyLetterId); // in case limit param is hit
      const higherUrgencyIndex = letterIds.indexOf(higherUrgencyLetterId);
      expect(indexToTest).toBeLessThan(higherUrgencyIndex); // higher urgency letters should come before lower urgency letters
    }
  }
}

async function verifyAllocationLogsContainPriority(
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
