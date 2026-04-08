import { test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "tests/helpers/aws-gateway-helper";
import { pollForLetterStatus } from "tests/helpers/poll-for-letters-helper";
import { getLettersFromQueueViaIndex } from "tests/helpers/generate-fetch-test-data";
import {
  getVariantsWithUrgency,
  sendEventsForVariants,
  supplier,
  verifyAllocationLogsContainPriority,
  verifyIndexPositionOfLetterVariants,
} from "tests/helpers/urgent-letter-priority-helper";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("Urgent Letter Priority Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test("Letter with higher urgency gets picked first", async ({ request }) => {
    const variantsUrgencyTen = getVariantsWithUrgency(10);
    const urgencyTenLetterIds = await sendEventsForVariants(variantsUrgencyTen);

    const variantsUrgencyNine = getVariantsWithUrgency(9);
    const urgencyNineLetterIds =
      await sendEventsForVariants(variantsUrgencyNine);

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
      urgencyTenLetterIds,
      urgencyNineLetterIds,
    );
  });
});
