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

// skipped: an earlier record this one depends on failed, so it is left for the Kinesis retry.
type RecordResult = {
  sequenceNumber: string;
  failed: boolean;
  skipped: boolean;
  delta: number;
  supplierId?: string;
};

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return async (streamEvent: KinesisStreamEvent) => {
    deps.logger.debug({
      logRef: LogRefs.RECEIVED_EVENT.code,
      description: LogRefs.RECEIVED_EVENT.description,
      streamEvent,
    });

    // Records are processed concurrently across letters but in order within a letter.
    // Maps each letter to its latest task, resolving to whether later records may proceed.
    const tasksByLetter = new Map<string, Promise<boolean>>();
    // The letter of an undecodable record is unknown, so every later record is
    // deferred to the retry in case it belongs to the same letter.
    let undecodableRecordSeen = false;
    const tasks = streamEvent.Records.map((record): Promise<RecordResult> => {
      const { sequenceNumber } = record.kinesis;
      if (undecodableRecordSeen) {
        return Promise.resolve(skippedResult(sequenceNumber));
      }
      let ddbRecord: DynamoDBRecord;
      try {
        ddbRecord = extractPayload(record, deps);
      } catch {
        undecodableRecordSeen = true;
        return Promise.resolve(failedResult(sequenceNumber));
      }

      // REMOVE events only have an OldImage.
      const image =
        ddbRecord.dynamodb?.NewImage ?? ddbRecord.dynamodb?.OldImage;
      const supplierId = image?.supplierId?.S;
      const letterId = image?.id?.S;
      // Same key as the queue table (supplierId, letterId): records for one queue item run in order.
      const key =
        supplierId && letterId
          ? JSON.stringify([supplierId, letterId])
          : undefined;
      // An earlier task for the same letter in this batch, if any; this task waits for it.
      const previous = key === undefined ? undefined : tasksByLetter.get(key);
      const task = (async (): Promise<RecordResult> => {
        // Skip if the previous task for this letter failed or was skipped, so writes
        // are never applied out of order. Kinesis retries them from the earliest failure.
        if (previous && !(await previous)) {
          return skippedResult(sequenceNumber);
        }

        try {
          if (isPendingLetter(ddbRecord)) {
            const letter = extractNewOrUpdatedLetter(ddbRecord);
            const added = await addPendingLetterToQueue(letter, deps);
            return {
              sequenceNumber,
              failed: false,
              skipped: false,
              delta: added,
              supplierId: letter.supplierId,
            };
          }
          if (isNoLongerPending(ddbRecord)) {
            const letter = extractNewOrUpdatedLetter(ddbRecord);
            const deleted = await deletePendingLetterFromQueue(letter, deps);
            return {
              sequenceNumber,
              failed: false,
              skipped: false,
              delta: -deleted,
              supplierId: letter.supplierId,
            };
          }
          return { sequenceNumber, failed: false, skipped: false, delta: 0 };
        } catch (error) {
          deps.logger.error({
            logRef: LogRefs.ERROR_PROCESSING_DDB_RECORD.code,
            description: LogRefs.ERROR_PROCESSING_DDB_RECORD.description,
            error,
            recordId: sequenceNumber,
            supplierId,
            letterId,
          });
          return failedResult(sequenceNumber);
        }
      })();
      if (key !== undefined) {
        // Becomes the "previous" task for the next record of this letter.
        tasksByLetter.set(
          key,
          task.then(({ failed, skipped }) => !failed && !skipped),
        );
      }
      return task;
    });

    // Results are in the same order as Records.
    const results = await Promise.all(tasks);
    const deltasBySupplierId = new Map<string, number>();
    let successCount = 0;
    let failureCount = 0;
    for (const result of results) {
      if (result.failed) {
        failureCount += 1;
      } else if (result.supplierId !== undefined) {
        // Each insert or delete changes the queue by one, so |delta| is the write count.
        successCount += Math.abs(result.delta);
        updateDeltas(deltasBySupplierId, result.supplierId, result.delta);
      }
    }
    recordProcessing(
      deps,
      successCount,
      failureCount,
      deltasBySupplierId,
      streamEvent.Records.length,
    );
    // Report only the earliest failure: Kinesis retries from that record onwards,
    // which includes skipped records. Replayed records that already succeeded are
    // safe because queue inserts and deletes are conditional writes.
    const firstFailure = results.find((result) => result.failed);
    return {
      batchItemFailures: firstFailure
        ? [{ itemIdentifier: firstFailure.sequenceNumber }]
        : [],
    };
  };
}

function failedResult(sequenceNumber: string): RecordResult {
  return { sequenceNumber, failed: true, skipped: false, delta: 0 };
}

function skippedResult(sequenceNumber: string): RecordResult {
  return { sequenceNumber, failed: false, skipped: true, delta: 0 };
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
  totalCount: number,
) {
  deps.logger.info({
    logRef: LogRefs.PROCESSING_COMPLETE.code,
    description: LogRefs.PROCESSING_COMPLETE.description,
    successCount,
    failureCount,
    processedCount: successCount + failureCount,
    totalCount,
  });

  for (const [supplierId, delta] of deltasBySupplierId) {
    deps.logger.info({
      ...buildMetric(supplierId, delta),
      logRef: LogRefs.QUEUE_DELTA_METRIC.code,
    });
  }
}

function isPendingLetter(record: DynamoDBRecord): boolean {
  const newImage = record.dynamodb?.NewImage;
  const isPending = newImage?.status?.S === "PENDING";

  return isPending;
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
    deps.logger.debug({
      logRef: LogRefs.PROCESSING_KINESIS_RECORD.code,
      description: LogRefs.PROCESSING_KINESIS_RECORD.description,
      recordId: record.kinesis.sequenceNumber,
    });

    // Kinesis data is base64 encoded
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf8");

    deps.logger.debug({
      logRef: LogRefs.DECODED_PAYLOAD.code,
      description: LogRefs.DECODED_PAYLOAD.description,
      payload,
    });

    const jsonParsed = JSON.parse(payload);

    deps.logger.debug({
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
      recordId: record.kinesis.sequenceNumber,
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
