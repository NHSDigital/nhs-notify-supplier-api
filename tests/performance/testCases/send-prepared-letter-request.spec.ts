import {
  PublishBatchCommand,
  PublishBatchRequestEntry,
} from "@aws-sdk/client-sns";
import { expect, test } from "@playwright/test";
import { snsClient } from "tests/helpers/aws-sns-helper";
import { retrieveKinesisRecordsAtTimestamp } from "tests/helpers/aws-kinesis-helper";
import { logger } from "tests/helpers/pino-logger";
import { envName } from "tests/constants/api-constants";
import PREPARED_LETTER from "../../resources/prepared-letter.json";

test.describe("Performance test checking how long it takes letter requests from the EventSub SNS to reach the Letters Database ", () => {
  test("send 2500 letter requests", async () => {
    const MESSAGES_TO_SEND = 2500;
    const FIVE_MINUTES = 1000 * 60 * 5;
    const BATCH_SIZE = 10;
    const SNS_ARN = `arn:aws:sns:eu-west-2:820178564574:nhs-${envName}-supapi-eventsub`;
    const KINESIS_STREAM_ARN = `arn:aws:kinesis:eu-west-2:820178564574:stream/nhs-${envName}-supapi-letter-change-stream`;
    test.setTimeout(FIVE_MINUTES);
    const startTime = Date.now();

    logger.info(
      `about to sent ${MESSAGES_TO_SEND} messages in batches of ${BATCH_SIZE}`,
    );
    let batch: PublishBatchRequestEntry[] = [];
    for (let i = 1; i <= MESSAGES_TO_SEND; i++) {
      const id = `performance-test-letter${i}-${startTime}`;
      const message = JSON.stringify({
        ...PREPARED_LETTER,
        data: { ...PREPARED_LETTER.data, domainId: id },
      });
      batch.push({ Id: id, Message: message });

      if (batch.length === BATCH_SIZE) {
        logger.info(`sending batch number ${i / BATCH_SIZE}`);
        await snsClient.send(
          new PublishBatchCommand({
            PublishBatchRequestEntries: batch,
            TopicArn: SNS_ARN,
          }),
        );
        batch = [];
      }
    }

    const pollInterval = 2 * 1000; // 2 seconds
    let recordsRetrieved = 0;
    logger.info("waiting for records to appear in Kinesis data stream");
    while (recordsRetrieved < MESSAGES_TO_SEND) {
      recordsRetrieved = await retrieveKinesisRecordsAtTimestamp(
        KINESIS_STREAM_ARN,
        startTime,
      );
      logger.info(`records retrieved: ${recordsRetrieved}`);
      if (recordsRetrieved >= MESSAGES_TO_SEND) {
        break;
      } else {
        logger.info(
          `waiting for ${pollInterval / 1000} seconds before polling again`,
        );
        await sleep(pollInterval);
      }
    }

    expect(recordsRetrieved).toBeGreaterThanOrEqual(MESSAGES_TO_SEND);

    const endTime = Date.now();
    logger.info(`final number of records retrieved: ${recordsRetrieved}`);
    logger.info(`FINAL TEST TIME WAS: ${(endTime - startTime) / 1000} seconds`);
  });
});

function sleep(timeInMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeInMs);
  });
}
