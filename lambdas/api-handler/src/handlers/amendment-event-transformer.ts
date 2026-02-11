import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { PublishCommand } from "@aws-sdk/client-sns";
import { LetterEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";
import { mapLetterToCloudEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-mapper";
import {
  UpdateLetterCommand,
  UpdateLetterCommandSchema,
} from "../contracts/letters";
import { Deps } from "../config/deps";

export default function createTransformAmendmentEventHandler(
  deps: Deps,
): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    const tasks = event.Records.map(async (message) => {
      try {
        const updateLetterCommand: UpdateLetterCommand =
          UpdateLetterCommandSchema.parse(JSON.parse(message.body));
        const letter = await deps.letterRepo.getLetterById(
          updateLetterCommand.supplierId,
          updateLetterCommand.id,
        );
        letter.status = updateLetterCommand.status;
        letter.reasonCode = updateLetterCommand.reasonCode;
        letter.reasonText = updateLetterCommand.reasonText;

        const letterEvent = mapLetterToCloudEvent(
          letter,
          deps.env.EVENT_SOURCE,
        );
        await deps.snsClient.send(
          buildSnsCommand(letterEvent, deps.env.SNS_TOPIC_ARN),
        );
        deps.logger.info({
          description: "Updated letter status",
          letterId: updateLetterCommand.id,
          messageId: message.messageId,
          correlationId: message.messageAttributes.CorrelationId.stringValue,
        });
      } catch (error) {
        deps.logger.error({
          description: "Error processing letter status update",
          err: error,
          messageId: message.messageId,
          correlationId: message.messageAttributes.CorrelationId.stringValue,
          messageBody: message.body,
        });
        batchItemFailures.push({ itemIdentifier: message.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}

function buildSnsCommand(
  letterEvent: LetterEvent,
  topicArn: string,
): PublishCommand {
  return new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(letterEvent),
  });
}
