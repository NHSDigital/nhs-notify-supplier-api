import { SQSEvent, Context, SQSHandler, SQSRecord } from 'aws-lambda';
import { LetterDto, LetterDtoSchema } from '../contracts/letters';
import { Deps } from '../config/deps';

export function createLetterStatusUpdateHandler(deps: Deps): SQSHandler {

  return async ( event: SQSEvent, context: Context ) => {
    for (const message of event.Records) {
      await processMessageAsync(message, deps);
    }
  }
}

async function processMessageAsync(message: SQSRecord, deps: Deps): Promise<any> {

  const letterToUpdate: LetterDto = LetterDtoSchema.parse(JSON.parse(message.body));

  try {
    await deps.letterRepo.updateLetterStatus(letterToUpdate);
  } catch (error) {
    deps.logger.error({ err: error }, `Error processing update to letterId=${letterToUpdate.id} supplierId=${letterToUpdate.supplierId} correlationId=${message.messageAttributes["CorrelationId"].stringValue}`);
  }
}
