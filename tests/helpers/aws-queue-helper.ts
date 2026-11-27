import {
  ChangeMessageVisibilityBatchCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { $MinimumLetterEvent } from "lambdas/common/types";
import {
  AWS_ACCOUNT_ID,
  AWS_REGION,
  envName,
} from "tests/constants/api-constants";
import { setTimeout as sleep } from "node:timers/promises";
import { logger } from "tests/helpers/pino-logger";

const POLL_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 500;
// Keeps received messages hidden while one iteration's parallel receives run, so together they
// return up to 50 distinct messages. Non-matching messages are released straight afterwards.
const RECEIVE_VISIBILITY_TIMEOUT_SECONDS = 30;
// Receives issued per iteration, each returning up to 10 messages.
const PARALLEL_RECEIVES = 5;

function messageMatchesDomainId(message: Message, domainId: string): boolean {
  if (!message.Body) {
    return false;
  }
  try {
    const letterEvent = $MinimumLetterEvent.parse(JSON.parse(message.Body));
    return letterEvent.data.domainId === domainId;
  } catch {
    // Allow for (and ignore) malformed messages on DLQ
    return false;
  }
}

async function deleteMessage(
  client: SQSClient,
  queueUrl: string,
  message: Message,
) {
  await client.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: message.ReceiptHandle,
    }),
  );
}

// Several specs poll the same DLQ in parallel, so a message one poller holds is invisible to the
// others. Releasing non-matching messages immediately stops pollers hiding each other's messages.
async function releaseMessages(
  client: SQSClient,
  queueUrl: string,
  messages: Message[],
) {
  if (messages.length === 0) {
    return;
  }
  try {
    await client.send(
      new ChangeMessageVisibilityBatchCommand({
        QueueUrl: queueUrl,
        Entries: messages.map((message, index) => ({
          Id: String(index),
          ReceiptHandle: message.ReceiptHandle,
          VisibilityTimeout: 0,
        })),
      }),
    );
  } catch (error) {
    // Not fatal: unreleased messages become visible again after the receive visibility timeout.
    logger.warn({ error }, `Failed to release messages on ${queueUrl}`);
  }
}

export async function pollQueueForLetterEvent(
  queueName: string,
  domainId: string,
) {
  const queueUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/nhs-${envName}-supapi-${queueName}`;
  const client = new SQSClient({ region: AWS_REGION });
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let scanned = 0;

  while (Date.now() < deadline) {
    const responses = await Promise.all(
      Array.from({ length: PARALLEL_RECEIVES }, () =>
        client.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            VisibilityTimeout: RECEIVE_VISIBILITY_TIMEOUT_SECONDS,
            WaitTimeSeconds: 1,
          }),
        ),
      ),
    );
    const messages = responses.flatMap((response) => response.Messages ?? []);
    scanned += messages.length;

    const matchingMessage = messages.find((message) =>
      messageMatchesDomainId(message, domainId),
    );

    // Each response holds at most 10 messages, the ChangeMessageVisibilityBatch limit.
    await Promise.all(
      responses.map((response) =>
        releaseMessages(
          client,
          queueUrl,
          (response.Messages ?? []).filter(
            (message) => message !== matchingMessage,
          ),
        ),
      ),
    );

    if (matchingMessage) {
      // Only delete the message this test produced; the DLQ is shared with other producers
      await deleteMessage(client, queueUrl, matchingMessage);
      logger.info(
        `Found message for domainId ${domainId} on ${queueName} after scanning ${scanned} message(s)`,
      );
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Timed out polling ${queueName} for domainId ${domainId} after scanning ${scanned} message(s). Check the DLQ backlog size.`,
  );
}
