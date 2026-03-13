import {
  MessageAttributeValue,
  PublishCommand,
  PublishCommandOutput,
} from "@aws-sdk/client-sns";
import { EVENT_SUBSCRIPTION_TOPIC_ARN } from "tests/constants/api-constants";
import { snsClient } from "tests/helpers/aws-sns-helper";

export type SnsEventMessage = Record<string, unknown> | string;

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
