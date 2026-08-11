import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { PreparedEventSchema } from "lambdas/supplier-allocator/src/handler/types";
import {
  AWS_ACCOUNT_ID,
  AWS_REGION,
  envName,
} from "tests/constants/api-constants";
import { setTimeout } from "node:timers/promises";

function messageMatchesDomainId(message: Message, domainId: string): boolean {
  if (!message.Body) {
    return false;
  }
  try {
    const letterEvent = PreparedEventSchema.parse(JSON.parse(message.Body));
    return letterEvent.data.domainId === domainId;
  } catch {
    // Allow for (and ignore) malformed messages on DLQ
    return false;
  }
}

async function doPoll(
  client: SQSClient,
  queueUrl: string,
  domainId: string,
  options: { abortSignal: AbortSignal },
) {
  let matchingMessage;
  do {
    const response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        VisibilityTimeout: 0,
        WaitTimeSeconds: 5,
      }),
      options,
    );

    matchingMessage = (response.Messages || []).find((message) =>
      messageMatchesDomainId(message, domainId),
    );
  } while (!matchingMessage && !options.abortSignal.aborted);

  if (matchingMessage) {
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: matchingMessage.ReceiptHandle,
      }),
      options,
    );
  } else {
    throw new Error("Timed out polling queue");
  }
}

export async function pollQueueForLetterEvent(
  queueName: string,
  domainId: string,
) {
  const queueUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/nhs-${envName}-supapi-${queueName}`;
  const client = new SQSClient({ region: AWS_REGION });

  const cancelTimeout = new AbortController();
  const cancelPolling = new AbortController();

  const timeoutPromise = setTimeout(60_000, undefined, {
    signal: cancelTimeout.signal,
  }).then(() => {
    cancelPolling.abort();
    throw new Error("Timed out polling queue");
  });

  const pollPromise = doPoll(client, queueUrl, domainId, {
    abortSignal: cancelPolling.signal,
  }).finally(() => {
    cancelTimeout.abort();
  });

  await Promise.race([timeoutPromise, pollPromise]);
}
