import {
  PublishBatchCommand,
  PublishBatchRequestEntry,
} from "@aws-sdk/client-sns";
import { expect, test } from "@playwright/test";
import { snsClient } from "tests/helpers/aws-sns-helper";
import { logger } from "tests/helpers/pino-logger";
import { AWS_ACCOUNT_ID, envName } from "tests/constants/api-constants";
import { randomUUID } from "node:crypto";
import PREPARED_LETTER from "../../resources/prepared-letter.json";

test.describe("Performance test publishing letter requests to EventSub SNS", () => {
  test("send 250_000 letter requests", async () => {
    const MESSAGES_TO_SEND = 250_000;
    const BATCH_SIZE = 10;
    const CONCURRENT_BATCHES = 10;
    const SNS_ARN = `arn:aws:sns:eu-west-2:${AWS_ACCOUNT_ID}:nhs-${envName}-supapi-eventsub`;
    test.setTimeout(60 * 60 * 1000);
    const startTime = Date.now();
    const runId = randomUUID();

    logger.info(
      `about to send ${MESSAGES_TO_SEND} messages in batches of ${BATCH_SIZE}, ${CONCURRENT_BATCHES} batches at a time`,
    );
    let published = 0;
    for (let first = 1; first <= MESSAGES_TO_SEND; ) {
      const pending: Promise<number>[] = [];
      for (
        let n = 0;
        n < CONCURRENT_BATCHES && first <= MESSAGES_TO_SEND;
        n++
      ) {
        const batch: PublishBatchRequestEntry[] = [];
        for (
          let i = 0;
          i < BATCH_SIZE && first <= MESSAGES_TO_SEND;
          i++, first++
        ) {
          const id = `performance-test-letter${first}-${runId}`;
          const message = JSON.stringify({
            ...PREPARED_LETTER,
            id: randomUUID(),
            data: { ...PREPARED_LETTER.data, domainId: id },
          });
          batch.push({ Id: id, Message: message });
        }
        pending.push(
          snsClient
            .send(
              new PublishBatchCommand({
                PublishBatchRequestEntries: batch,
                TopicArn: SNS_ARN,
              }),
            )
            .then((response) => {
              if (response.Failed?.length) {
                throw new Error(
                  `SNS failed to publish batch entries: ${JSON.stringify(response.Failed)}`,
                );
              }
              const successful = response.Successful?.length ?? 0;
              if (successful !== batch.length) {
                throw new Error(
                  `SNS confirmed ${successful} of ${batch.length} batch entries`,
                );
              }
              return successful;
            }),
        );
      }
      const results = await Promise.allSettled(pending);
      for (const result of results) {
        if (result.status === "rejected") {
          throw result.reason;
        }
        published += result.value;
      }
      if ((first - 1) % (BATCH_SIZE * 100) === 0 || first > MESSAGES_TO_SEND) {
        logger.info(`published ${published} messages`);
      }
    }

    expect(published).toBe(MESSAGES_TO_SEND);
    const endTime = Date.now();
    logger.info(`FINAL TEST TIME WAS: ${(endTime - startTime) / 1000} seconds`);
  });
});
