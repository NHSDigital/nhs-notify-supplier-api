import {
  DynamoDBRecord,
  Handler,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import { z } from "zod";
import {
  InsertPendingLetter,
  LetterAlreadyExistsError,
  LetterNotFoundError,
  LetterSchema,
} from "@internal/datastore";
import { Deps } from "./deps";
import LogRefs from "./log-references";

// Only the letter fields this Lambda uses, so a change to any other letter field
// (e.g. a new required field missing from older letters) cannot make a record fail.
const QueueKeySchema = LetterSchema.pick({ supplierId: true, id: true });
const PendingLetterSourceSchema = LetterSchema.pick({
  supplierId: true,
  id: true,
  specificationId: true,
  groupId: true,
  priority: true,
  sha256Hash: true,
});
type QueueKey = z.infer<typeof QueueKeySchema>;
type PendingLetterSource = z.infer<typeof PendingLetterSourceSchema>;

// succeeded: done, including no-ops.
// failed: a write error that may be transient, so Kinesis retries from this record.
// skipped: an earlier record for the same letter failed, so this one is retried with it.
// dropped: the record can never be processed (undecodable or invalid letter data),
//   so it is logged as an ERROR and not retried, to avoid blocking the shard.
type Outcome = "succeeded" | "failed" | "skipped" | "dropped";

type RecordResult = {
  sequenceNumber: string;
  outcome: Outcome;
  // delta and supplierId are only set when a queue write was attempted.
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
    const tasks = streamEvent.Records.map((record): Promise<RecordResult> => {
      const { sequenceNumber } = record.kinesis;
      let ddbRecord: DynamoDBRecord;
      try {
        ddbRecord = extractPayload(record, deps);
      } catch {
        // Already logged as an ERROR; retrying can never decode it.
        return Promise.resolve(result(sequenceNumber, "dropped"));
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
          return result(sequenceNumber, "skipped");
        }

        try {
          if (isPendingLetter(ddbRecord)) {
            const letter = parseNewImage(
              ddbRecord,
              PendingLetterSourceSchema,
              sequenceNumber,
              deps,
            );
            if (letter === undefined) {
              return result(sequenceNumber, "dropped");
            }
            const added = await addPendingLetterToQueue(letter, deps);
            return result(
              sequenceNumber,
              "succeeded",
              added,
              letter.supplierId,
            );
          }
          if (isNoLongerPending(ddbRecord)) {
            // Removing a letter queue entry only needs its keys.
            const letter = parseNewImage(
              ddbRecord,
              QueueKeySchema,
              sequenceNumber,
              deps,
            );
            if (letter === undefined) {
              return result(sequenceNumber, "dropped");
            }
            const deleted = await deletePendingLetterFromQueue(letter, deps);
            return result(
              sequenceNumber,
              "succeeded",
              -deleted,
              letter.supplierId,
            );
          }
          return result(sequenceNumber, "succeeded");
        } catch (error) {
          deps.logger.error({
            logRef: LogRefs.ERROR_PROCESSING_DDB_RECORD.code,
            description: LogRefs.ERROR_PROCESSING_DDB_RECORD.description,
            err: error,
            recordId: sequenceNumber,
            supplierId,
            letterId,
          });
          return result(sequenceNumber, "failed");
        }
      })();
      if (key !== undefined) {
        // Becomes the "previous" task for the next record of this letter.
        // A dropped record will never be retried, so later records must not wait for it.
        tasksByLetter.set(
          key,
          task.then(
            ({ outcome }) => outcome === "succeeded" || outcome === "dropped",
          ),
        );
      }
      return task;
    });

    // Results are in the same order as Records.
    const results = await Promise.all(tasks);
    const deltasBySupplierId = new Map<string, number>();
    for (const { delta, outcome, supplierId } of results) {
      if (outcome === "succeeded" && supplierId !== undefined) {
        updateDeltas(deltasBySupplierId, supplierId, delta);
      }
    }
    recordProcessing(deps, results, deltasBySupplierId);
    // Report only the earliest failure: Kinesis retries from that record onwards,
    // which includes skipped records. Replayed records that already succeeded are
    // safe because queue inserts and deletes are conditional writes.
    const firstFailure = results.find(({ outcome }) => outcome === "failed");
    return {
      batchItemFailures: firstFailure
        ? [{ itemIdentifier: firstFailure.sequenceNumber }]
        : [],
    };
  };
}

function result(
  sequenceNumber: string,
  outcome: Outcome,
  delta = 0,
  supplierId?: string,
): RecordResult {
  return supplierId === undefined
    ? { sequenceNumber, outcome, delta }
    : { sequenceNumber, outcome, delta, supplierId };
}

async function addPendingLetterToQueue(
  letter: PendingLetterSource,
  deps: Deps,
): Promise<number> {
  const pendingLetter = mapLetterToPendingLetter(letter);

  try {
    await deps.letterQueueRepository.putLetter(pendingLetter);
    deps.logger.info({
      logRef: LogRefs.LETTER_ADDED_TO_QUEUE.code,
      description: LogRefs.LETTER_ADDED_TO_QUEUE.description,
      supplierId: pendingLetter.supplierId,
      letterId: pendingLetter.letterId,
    });
    return 1;
  } catch (error) {
    if (error instanceof LetterAlreadyExistsError) {
      deps.logger.info({
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
  letter: QueueKey,
  deps: Deps,
): Promise<number> {
  try {
    await deps.letterQueueRepository.deleteLetter(letter.supplierId, letter.id);
    deps.logger.info({
      logRef: LogRefs.LETTER_REMOVED_FROM_QUEUE.code,
      description: LogRefs.LETTER_REMOVED_FROM_QUEUE.description,
      supplierId: letter.supplierId,
      letterId: letter.id,
    });
    return 1;
  } catch (error) {
    if (error instanceof LetterNotFoundError) {
      deps.logger.info({
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
  results: RecordResult[],
  deltasBySupplierId: Map<string, number>,
) {
  const count = (outcome: Outcome) =>
    results.filter((r) => r.outcome === outcome).length;
  deps.logger.info({
    logRef: LogRefs.PROCESSING_COMPLETE.code,
    description: LogRefs.PROCESSING_COMPLETE.description,
    successCount: count("succeeded"),
    failureCount: count("failed"),
    skippedAfterFailureCount: count("skipped"),
    droppedCount: count("dropped"),
    totalCount: results.length,
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

function parseNewImage<T extends z.ZodType>(
  record: DynamoDBRecord,
  schema: T,
  sequenceNumber: string,
  deps: Deps,
): z.infer<T> | undefined {
  try {
    return schema.parse(unmarshall(record.dynamodb?.NewImage as any));
  } catch (error) {
    const newImage = record.dynamodb?.NewImage;
    deps.logger.error({
      logRef: LogRefs.INVALID_LETTER_DROPPED.code,
      description: LogRefs.INVALID_LETTER_DROPPED.description,
      // Which fields failed and why (e.g. "supplierId: Invalid input: expected string,
      // received undefined"). Zod issues do not include the field values.
      invalidFields:
        error instanceof z.ZodError
          ? error.issues.map(
              ({ message, path }) => `${path.join(".")}: ${message}`,
            )
          : undefined,
      err: error,
      recordId: sequenceNumber,
      // null rather than undefined so a missing value still appears in the log.
      supplierId: newImage?.supplierId?.S ?? null,
      letterId: newImage?.id?.S ?? null,
    });
    return undefined;
  }
}

function mapLetterToPendingLetter(
  letter: PendingLetterSource,
): InsertPendingLetter {
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
