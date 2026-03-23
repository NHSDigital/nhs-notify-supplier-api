import {
  MessageAttributeValue,
  PublishBatchCommand,
  PublishBatchCommandOutput,
  PublishBatchRequestEntry,
  PublishCommand,
  PublishCommandOutput,
} from "@aws-sdk/client-sns";
import { EVENT_SUBSCRIPTION_TOPIC_ARN } from "tests/constants/api-constants";
import { snsClient } from "tests/helpers/aws-sns-helper";

export type SnsEventMessage = Record<string, unknown> | string;
export type SnsBatchEventEntry = {
  id?: string;
  message: SnsEventMessage;
  messageAttributes?: Record<string, MessageAttributeValue>;
};

export async function sendSnsEvent(
  message: SnsEventMessage,
  messageAttributes?: Record<string, MessageAttributeValue>,
): Promise<PublishCommandOutput> {
  return snsClient.send(
    new PublishCommand({
      TopicArn: EVENT_SUBSCRIPTION_TOPIC_ARN,
      Message: typeof message === "string" ? message : JSON.stringify(message),
      ...(messageAttributes ? { MessageAttributes: messageAttributes } : {}),
    }),
  );
}

export async function sendSnsBatchEvent(
  messages: SnsBatchEventEntry[],
): Promise<PublishBatchCommandOutput> {
  const publishBatchRequestEntries: PublishBatchRequestEntry[] = messages.map(
    ({ id, message, messageAttributes }, index) => ({
      Id: id ?? `message-${index + 1}`,
      Message: typeof message === "string" ? message : JSON.stringify(message),
      ...(messageAttributes && {
        MessageAttributes: messageAttributes,
      }),
    }),
  );

  const command = new PublishBatchCommand({
    TopicArn: EVENT_SUBSCRIPTION_TOPIC_ARN,
    PublishBatchRequestEntries: publishBatchRequestEntries,
  });

  return snsClient.send(command);
}
