import { SQSEvent, SQSHandler } from "aws-lambda";
import {
  UpdateLetterCommand,
  UpdateLetterCommandSchema,
} from "../contracts/letters";
import { Deps } from "../config/deps";
import { mapToUpdateLetter } from "../mappers/letter-mapper";

export default function createLetterStatusUpdateHandler(
  deps: Deps,
): SQSHandler {
  return async (event: SQSEvent) => {
    const tasks = event.Records.map(async (message) => {
      try {
        const letterToUpdate: UpdateLetterCommand =
          UpdateLetterCommandSchema.parse(JSON.parse(message.body));
        await deps.letterRepo.updateLetterStatus(
          mapToUpdateLetter(letterToUpdate),
        );
      } catch (error) {
        deps.logger.error(
          {
            err: error,
            messageId: message.messageId,
            correlationId: message.messageAttributes.CorrelationId.stringValue,
            messageBody: message.body,
          },
          "Error processing letter status update",
        );
      }
    });

    await Promise.all(tasks);
  };
}
