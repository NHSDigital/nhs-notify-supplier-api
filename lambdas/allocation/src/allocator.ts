import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  $LetterEvent,
  LetterEvent,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { Deps } from "./deps";

export default function createAllocator(deps: Deps): SNSHandler {
  return async (event: SNSEvent): Promise<void> => {
    // Allocation will be done under a future ticket. For now, just place events on the queue,
    // adding a message group ID to permit the use of a FIFO queue
    const sqsCommands: SendMessageCommand[] = event.Records.map((record) =>
      extractLetterEvent(record),
    ).map((letterEvent) => buildSendMessageCommand(letterEvent, deps.queueUrl));

    for (const sqsCommand of sqsCommands) {
      deps.logger.info({
        description: "Placing message on queue",
        MessageGroupId: sqsCommand.input.MessageGroupId,
      });
      await deps.sqsClient.send(sqsCommand);
    }
  };
}

function extractLetterEvent(record: SNSEventRecord): LetterEvent {
  return $LetterEvent.parse(JSON.parse(record.Sns.Message));
}

function buildSendMessageCommand(letterEvent: LetterEvent, queueUrl: string) {
  return new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(letterEvent),
    MessageGroupId: letterEvent.data.domainId,
  });
}
