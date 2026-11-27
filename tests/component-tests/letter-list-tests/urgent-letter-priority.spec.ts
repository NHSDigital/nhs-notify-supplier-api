import { test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "tests/helpers/aws-gateway-helper";
import {
  acceptTestLetters,
  pollForLetterStatus,
} from "tests/helpers/poll-for-letters-helper";
import {
  getLetterIdsContainingAll,
  getVariantsWithPriority,
  sendEventsForVariants,
  supplier,
  verifyAllocationLogsContainPriority,
  verifyMoreUrgentLettersReturnedFirst,
} from "tests/helpers/urgent-letter-priority-helper";
import { createValidRequestHeaders } from "tests/constants/request-headers";
import { supplierDataSetup } from "tests/helpers/suppliers-setup-helper";
import { logger } from "tests/helpers/pino-logger";

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
  await supplierDataSetup(supplier);
});

test.describe("Urgent Letter Priority Tests", () => {
  test.setTimeout(180_000); // 3 minutes for long running polling

  test("Letters with higher urgency get picked first", async ({ request }) => {
    // Lower priority numbers are more urgent, so priority 9 must be returned before priority 10
    const lessUrgentLetterIds = await sendEventsForVariants(
      getVariantsWithPriority(10),
    );
    const moreUrgentLetterIds = await sendEventsForVariants(
      getVariantsWithPriority(9),
    );

    logger.info({ moreUrgentLetterIds, lessUrgentLetterIds });

    const allLetterIds = [...moreUrgentLetterIds, ...lessUrgentLetterIds];
    try {
      await Promise.all(
        allLetterIds.map(async (domainId) =>
          pollForLetterStatus(request, supplier, domainId, baseUrl),
        ),
      );

      await verifyAllocationLogsContainPriority(moreUrgentLetterIds, 9);
      await verifyAllocationLogsContainPriority(lessUrgentLetterIds, 10);

      const headers = createValidRequestHeaders(supplier);
      const letterIds = await getLetterIdsContainingAll(
        request,
        baseUrl,
        headers,
        allLetterIds,
      );

      verifyMoreUrgentLettersReturnedFirst(
        letterIds,
        { priority: 9, letterIds: moreUrgentLetterIds },
        { priority: 10, letterIds: lessUrgentLetterIds },
      );
    } finally {
      await acceptTestLetters(request, supplier, allLetterIds, baseUrl);
    }
  });
});
