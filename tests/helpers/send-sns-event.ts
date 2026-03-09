import {
  CreateTopicCommand,
  MessageAttributeValue,
  PublishCommand,
  PublishCommandOutput,
} from "@aws-sdk/client-sns";
import { snsClient } from "tests/helpers/aws-sns-helper";
import { EVENT_SUBSCRIPTION_TOPIC_NAME } from "tests/constants/api-constants";

export type SnsEventMessage = Record<string, unknown> | string;

export async function sendSnsEvent(
  message: SnsEventMessage,
  messageAttributes?: Record<string, MessageAttributeValue>,
): Promise<PublishCommandOutput> {
  const { TopicArn } = await snsClient.send(
    new CreateTopicCommand({
      Name: EVENT_SUBSCRIPTION_TOPIC_NAME,
    }),
  );

  if (!TopicArn) {
    throw new Error(
      `Failed to resolve SNS topic ARN for ${EVENT_SUBSCRIPTION_TOPIC_NAME}`,
    );
  }

  return snsClient.send(
    new PublishCommand({
      TopicArn,
      Message: typeof message === "string" ? message : JSON.stringify(message),
      ...(messageAttributes ? { MessageAttributes: messageAttributes } : {}),
    }),
  );
}
