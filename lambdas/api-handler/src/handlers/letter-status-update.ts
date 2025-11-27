import { SQSEvent, SQSHandler } from "aws-lambda";
import { LetterDto, LetterDtoSchema } from "../contracts/letters";
import { Deps } from "../config/deps";

export default function createLetterStatusUpdateHandler(
  deps: Deps,
): SQSHandler {
  return async (event: SQSEvent) => {
    const tasks = event.Records.map(async (message) => {
      try {
        const letterToUpdate: LetterDto = LetterDtoSchema.parse(
          JSON.parse(message.body),
        );
        await deps.letterRepo.updateLetterStatus(letterToUpdate);
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
