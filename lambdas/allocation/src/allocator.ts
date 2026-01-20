import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "node:crypto";

import { Deps } from "./deps";

export default function createAllocator(deps: Deps): SNSHandler {
  return async (event: SNSEvent): Promise<void> => {
    // Allocation will be done under a future ticket. For now, just place events on the queue,
    // adding a message group ID to permit the use of a FIFO queue
    const sqsCommands: SendMessageCommand[] = event.Records.map((record) =>
      buildSendMessageCommand(record, deps.queueUrl),
    );

    for (const sqsCommand of sqsCommands) {
      deps.logger.info({
        description: "Placing message on queue",
        MessageGroupId: sqsCommand.input.MessageGroupId,
      });
      await deps.sqsClient.send(sqsCommand);
    }
  };
}

function buildSendMessageCommand(snsRecord: SNSEventRecord, queueUrl: string) {
  return new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(snsRecord.Sns),
    // Using a random UUID here effectively means that the amendments queue is not FIFO for new pending
    // letters. Pragmatically this is OK because we shouldn't be getting updates from the supplier yet.
    MessageGroupId: randomUUID(),
  });
}
