import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { UpsertLetter } from "@internal/datastore";
import {
  LetterRequestPreparedEvent,
  LetterRequestPreparedEventSchema,
} from "../contracts/letters";
import { Deps } from "../config/deps";

function mapToUpsertLetter(
  upsertRequest: LetterRequestPreparedEvent,
): UpsertLetter {
  return {
    id: upsertRequest.data.domainId,
    supplierId: upsertRequest.data.supplierId,
    status: "PENDING",
    specificationId: upsertRequest.data.specificationId,
    groupId:
      upsertRequest.data.clientId +
      upsertRequest.data.campaignId +
      upsertRequest.data.templateId,
    url: upsertRequest.data.url,
    // TODO CCM-12997 source
    // TODO CCM-12997 urgency
    // TODO CCM-12997 queueVisibility
  };
}

export default function createUpsertLetterHandler(deps: Deps): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    const tasks = event.Records.map(async (record) => {
      try {
        const upsertRequest: LetterRequestPreparedEvent =
          LetterRequestPreparedEventSchema.parse(JSON.parse(record.body));

        const letterToUpsert: UpsertLetter = mapToUpsertLetter(upsertRequest);

        await deps.letterRepo.upsertLetter(letterToUpsert);
      } catch (error) {
        deps.logger.error({ err: error }, "Error processing upsert");
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}
