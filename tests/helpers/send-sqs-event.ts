import {
  SQSClient,
  SendMessageBatchCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { UPSERT_LETTERS_QUEUE_URL } from "tests/constants/api-constants";

const sqsClient = new SQSClient({});

export async function sendSqsEvent(messageBody: string): Promise<void> {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: UPSERT_LETTERS_QUEUE_URL,
      MessageBody: messageBody,
    }),
  );
}

export async function sendSqsEventBatch(messages: string[]): Promise<void> {
  await sqsClient.send(
    new SendMessageBatchCommand({
      QueueUrl: UPSERT_LETTERS_QUEUE_URL,
      Entries: messages.map((message, index) => ({
        Id: `message-${index}`,
        MessageBody: message,
      })),
    }),
  );
}
