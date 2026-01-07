import { SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import { PutRecordCommand } from "@aws-sdk/client-firehose";
import { Deps } from "./deps";

export default function createForwarder(deps: Deps): SQSHandler {
  return async (event: SQSEvent): Promise<void> => {
    const firehoseCommands: PutRecordCommand[] = event.Records.map((record) =>
      buildPutRecordCommand(record, deps.deliveryStreamName),
    );

    for (const firehoseCommand of firehoseCommands) {
      deps.logger.info({ description: "Sending firehose command" });
      await deps.firehoseClient.send(firehoseCommand);
    }
  };
}

/**
 * Builds a PutRecordCommand for Firehose.
 * The SQS message body already contains the SNS notification wrapper
 * (since raw_message_delivery is false on the SNS->SQS subscription),
 * so we forward it directly to Firehose.
 */
function buildPutRecordCommand(
  record: SQSRecord,
  deliveryStreamName: string,
): PutRecordCommand {
  // Add a newline to each record for proper JSON Lines format in S3
  const data = `${record.body}\n`;

  return new PutRecordCommand({
    DeliveryStreamName: deliveryStreamName,
    Record: {
      Data: Buffer.from(data),
    },
  });
}
