import { expect, test } from "@playwright/test";
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
import { createValidRequestHeaders } from "tests/constants/request-headers";
import { SUPPLIER_LETTERS } from "tests/constants/api-constants";
import {
  GetLettersResponse,
  GetLettersResponseSchema,
} from "../../../lambdas/api-handler/src/contracts/letters";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe("Urgent Letter Priority Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test("Letters with higher urgency get picked first", async ({ request }) => {
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

    const header = createValidRequestHeaders(supplier);
    const response = await request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
      headers: header,
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.data.length).toBeGreaterThanOrEqual(1);

    const getLettersResponse: GetLettersResponse =
      GetLettersResponseSchema.parse(responseBody);

    const letterIds = getLettersResponse.data.map((letter) => letter.id);
    expect(letterIds).toEqual(letterIdsFromQueue);

    verifyIndexPositionOfLetterVariants(
      letterIdsFromQueue,
      urgencyTenLetterIds,
      urgencyNineLetterIds,
    );
  });
});
