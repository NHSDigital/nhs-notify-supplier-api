import {
  DynamoDBRecord,
  Handler,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import {
  InsertPendingLetter,
  Letter,
  LetterAlreadyExistsError,
  LetterNotFoundError,
  LetterSchema,
} from "@internal/datastore";
import { Deps } from "./deps";
import LogRefs from "./log-references";

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return async (streamEvent: KinesisStreamEvent) => {
    let successCount = 0;

    // The change in the size of the pending letters queue, keyed by supplier
    const deltasBySupplierId = new Map<string, number>();

    deps.logger.info({
      logRef: LogRefs.RECEIVED_EVENT.code,
      description: LogRefs.RECEIVED_EVENT.description,
      streamEvent,
    });
    deps.logger.info({
      logRef: LogRefs.NUMBER_OF_RECORDS.code,
      description: LogRefs.NUMBER_OF_RECORDS.description,
      count: streamEvent.Records?.length || 0,
    });

    for (const record of streamEvent.Records) {
      const ddbRecord = extractPayload(record, deps);

      try {
        if (isNewPendingLetter(ddbRecord)) {
          const letter = extractNewOrUpdatedLetter(ddbRecord);
          const added = await addPendingLetterToQueue(letter, deps);
          updateDeltas(deltasBySupplierId, letter.supplierId, added);
          successCount += added;
        } else if (isNoLongerPending(ddbRecord)) {
          const letter = extractNewOrUpdatedLetter(ddbRecord);
          const deleted = await deletePendingLetterFromQueue(letter, deps);
          updateDeltas(deltasBySupplierId, letter.supplierId, -deleted);
          successCount += deleted;
        }
      } catch (error) {
        deps.logger.error({
          logRef: LogRefs.ERROR_PROCESSING_DDB_RECORD.code,
          description: LogRefs.ERROR_PROCESSING_DDB_RECORD.description,
          error,
          ddbRecord,
        });
        recordProcessing(deps, successCount, 1, deltasBySupplierId);
        // If we get a failure, return immediately without processing the remaining records. Since we are
        // working with a Kinesis stream, AWS will retry from the point of failure and no records will be lost.
        // See https://docs.aws.amazon.com/lambda/latest/dg/example_serverless_Kinesis_Lambda_batch_item_failures_section.html
        return {
          batchItemFailures: [
            { itemIdentifier: record.kinesis.sequenceNumber },
          ],
        };
      }
    }
    recordProcessing(deps, successCount, 0, deltasBySupplierId);
    return { batchItemFailures: [] };
  };
}

async function addPendingLetterToQueue(
  letter: Letter,
  deps: Deps,
): Promise<number> {
  const pendingLetter = mapLetterToPendingLetter(letter);

  try {
    deps.logger.info({
      logRef: LogRefs.PERSISTING_PENDING_LETTER.code,
      description: LogRefs.PERSISTING_PENDING_LETTER.description,
      pendingLetter,
    });
    await deps.letterQueueRepository.putLetter(pendingLetter);
    return 1;
  } catch (error) {
    if (error instanceof LetterAlreadyExistsError) {
      deps.logger.warn({
        logRef: LogRefs.LETTER_ALREADY_EXISTS.code,
        description: LogRefs.LETTER_ALREADY_EXISTS.description,
        supplierId: pendingLetter.supplierId,
        letterId: pendingLetter.letterId,
      });
      return 0;
    }
    throw error;
  }
}

async function deletePendingLetterFromQueue(
  letter: Letter,
  deps: Deps,
): Promise<number> {
  try {
    deps.logger.info({
      logRef: LogRefs.DELETING_PENDING_LETTER.code,
      description: LogRefs.DELETING_PENDING_LETTER.description,
      supplierId: letter.supplierId,
      letterId: letter.id,
    });
    await deps.letterQueueRepository.deleteLetter(letter.supplierId, letter.id);
    return 1;
  } catch (error) {
    if (error instanceof LetterNotFoundError) {
      deps.logger.warn({
        logRef: LogRefs.LETTER_DOES_NOT_EXIST.code,
        description: LogRefs.LETTER_DOES_NOT_EXIST.description,
        supplierId: letter.supplierId,
        letterId: letter.id,
      });
      return 0;
    }
    throw error;
  }
}

function recordProcessing(
  deps: Deps,
  successCount: number,
  failureCount: number,
  deltasBySupplierId: Map<string, number>,
) {
  deps.logger.info({
    logRef: LogRefs.PROCESSING_COMPLETE.code,
    description: LogRefs.PROCESSING_COMPLETE.description,
    successCount,
    failureCount,
    totalProcessed: successCount + failureCount,
  });

  for (const [supplierId, delta] of deltasBySupplierId) {
    deps.logger.info({
      ...buildMetric(supplierId, delta),
      logRef: LogRefs.QUEUE_DELTA_METRIC.code,
    });
  }
}

function isNewPendingLetter(record: DynamoDBRecord): boolean {
  const isInsert = record.eventName === "INSERT";
  const newImage = record.dynamodb?.NewImage;
  const isPending = newImage?.status?.S === "PENDING";

  return isInsert && isPending;
}

function isNoLongerPending(record: DynamoDBRecord): boolean {
  const isUpdate = record.eventName === "MODIFY";
  const oldImage = record.dynamodb?.OldImage;
  const newImage = record.dynamodb?.NewImage;
  const noLongerPending =
    oldImage?.status?.S === "PENDING" && newImage?.status?.S !== "PENDING";
  return isUpdate && noLongerPending;
}

function extractPayload(
  record: KinesisStreamRecord,
  deps: Deps,
): DynamoDBRecord {
  try {
    deps.logger.info({
      logRef: LogRefs.PROCESSING_KINESIS_RECORD.code,
      description: LogRefs.PROCESSING_KINESIS_RECORD.description,
      recordId: record.kinesis.sequenceNumber,
    });

    // Kinesis data is base64 encoded
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf8");
    deps.logger.info({
      logRef: LogRefs.DECODED_PAYLOAD.code,
      description: LogRefs.DECODED_PAYLOAD.description,
      payload,
    });

    const jsonParsed = JSON.parse(payload);
    deps.logger.info({
      logRef: LogRefs.EXTRACTED_DYNAMODB_RECORD.code,
      description: LogRefs.EXTRACTED_DYNAMODB_RECORD.description,
      jsonParsed,
    });
    return jsonParsed;
  } catch (error) {
    deps.logger.error({
      logRef: LogRefs.ERROR_EXTRACTING_PAYLOAD.code,
      description: LogRefs.ERROR_EXTRACTING_PAYLOAD.description,
      err: error,
      eventId: record.eventID,
    });
    throw error;
  }
}

function extractNewOrUpdatedLetter(record: DynamoDBRecord): Letter {
  const newImage = record.dynamodb?.NewImage;
  return LetterSchema.parse(unmarshall(newImage as any));
}

function mapLetterToPendingLetter(letter: Letter): InsertPendingLetter {
  return {
    supplierId: letter.supplierId,
    letterId: letter.id,
    specificationId: letter.specificationId,
    groupId: letter.groupId,
    priority: letter.priority,
    sha256Hash: letter.sha256Hash,
  };
}

function buildMetric(supplierId: string, delta: number) {
  return buildEMFObject(
    "update-letter-queue",
    { supplier: supplierId },
    {
      key: "QueueDelta",
      value: delta,
      unit: Unit.Count,
    },
  );
}

function updateDeltas(
  deltasBySupplierId: Map<string, number>,
  supplierId: string,
  delta: number,
): void {
  const current = deltasBySupplierId.get(supplierId) ?? 0;
  deltasBySupplierId.set(supplierId, current + delta);
}
