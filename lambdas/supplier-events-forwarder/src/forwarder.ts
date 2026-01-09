import { SNSEvent, SNSEventRecord, SNSHandler, SNSMessage } from "aws-lambda";
import { PutRecordCommand } from "@aws-sdk/client-firehose";
import { Deps } from "./deps";

export default function createForwarder(deps: Deps): SNSHandler {
  return async (event: SNSEvent): Promise<void> => {
    const firehoseCommands: PutRecordCommand[] = event.Records.map((record) =>
      buildPutRecordCommand(record, deps.deliveryStreamName),
    );

    for (const firehoseCommand of firehoseCommands) {
      await deps.firehoseClient.send(firehoseCommand);
    }
  };
}

/**
 * Builds an SNS notification wrapper matching the format that Firehose receives
 * when raw_message_delivery is false on a direct SNS->Firehose subscription.
 */
function buildSnsNotificationWrapper(record: SNSEventRecord): SNSMessage {
  return {
    Type: "Notification",
    MessageId: record.Sns.MessageId,
    TopicArn: record.Sns.TopicArn,
    Subject: record.Sns.Subject,
    Message: record.Sns.Message,
    Timestamp: record.Sns.Timestamp,
    SignatureVersion: record.Sns.SignatureVersion,
    Signature: record.Sns.Signature,
    SigningCertUrl: record.Sns.SigningCertUrl,
    UnsubscribeUrl: record.Sns.UnsubscribeUrl,
    MessageAttributes: record.Sns.MessageAttributes,
  };
}

function buildPutRecordCommand(
  record: SNSEventRecord,
  deliveryStreamName: string,
): PutRecordCommand {
  const snsNotification = buildSnsNotificationWrapper(record);
  // Add a newline to each record for proper JSON Lines format in S3
  const data = `${JSON.stringify(snsNotification)}\n`;

  return new PutRecordCommand({
    DeliveryStreamName: deliveryStreamName,
    Record: {
      Data: Buffer.from(data),
    },
  });
}
