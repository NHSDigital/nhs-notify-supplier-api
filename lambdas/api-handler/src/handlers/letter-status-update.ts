import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { LetterDto, LetterDtoSchema } from '../contracts/letters';
import { Deps } from '../config/deps';

export function createLetterStatusUpdateHandler(deps: Deps): SQSHandler {

  return async ( event: SQSEvent ) => {
    for (const message of event.Records) {
      await processMessageAsync(message, deps);
    }
  }
}

async function processMessageAsync(message: SQSRecord, deps: Deps): Promise<any> {

  try {
    const letterToUpdate: LetterDto = LetterDtoSchema.parse(JSON.parse(message.body));
    await deps.letterRepo.updateLetterStatus(letterToUpdate);
  } catch (error) {
    deps.logger.error({
      err: error,
      messageId: message.messageId,
      correlationId: message.messageAttributes['CorrelationId'].stringValue,
      messageBody: message.body
    }, 'Error processing letter status update');
  }
}
