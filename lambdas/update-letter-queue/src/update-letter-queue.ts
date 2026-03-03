import {
  DynamoDBRecord,
  Handler,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { Unit } from "aws-embedded-metrics";
import { MetricStatus, buildEMFObject } from "@internal/helpers";
import {
  InsertPendingLetter,
  Letter,
  LetterAlreadyExistsError,
  LetterDoesNotExistError,
  LetterSchema,
} from "@internal/datastore";
import { Deps } from "./deps";

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return async (streamEvent: KinesisStreamEvent) => {
    let successCount = 0;

    deps.logger.info({ description: "Received event", streamEvent });
    deps.logger.info({
      description: "Number of records",
      count: streamEvent.Records?.length || 0,
    });

    for (const record of streamEvent.Records) {
      const ddbRecord = extractPayload(record, deps);

      try {
        if (isNewPendingLetter(ddbRecord)) {
          const added = await addPendingLetterToQueue(ddbRecord, deps);
          successCount += added ? 1 : 0;
        } else if (isNoLongerPending(ddbRecord)) {
          const deleted = await deletePendingLetterFromQueue(ddbRecord, deps);
          successCount += deleted ? 1 : 0;
        }
      } catch (error) {
        deps.logger.error({
          description: "Error processing ddbRecord",
          error,
          ddbRecord,
        });
        recordProcessing(deps, successCount, 1);
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
    recordProcessing(deps, successCount, 0);
    return { batchItemFailures: [] };
  };
}

async function addPendingLetterToQueue(
  ddbRecord: DynamoDBRecord,
  deps: Deps,
): Promise<boolean> {
  const letter = extractNewLetter(ddbRecord);
  const pendingLetter = mapLetterToPendingLetter(letter);

  try {
    deps.logger.info({
      description: "Persisting pending letter",
      pendingLetter,
    });
    await deps.letterQueueRepository.putLetter(pendingLetter);
    return true;
  } catch (error) {
    if (error instanceof LetterAlreadyExistsError) {
      deps.logger.warn({
        description: "Letter already exists",
        supplierId: pendingLetter.supplierId,
        letterId: pendingLetter.letterId,
      });
      return false;
    }
    throw error;
  }
}

async function deletePendingLetterFromQueue(
  ddbRecord: DynamoDBRecord,
  deps: Deps,
): Promise<boolean> {
  const letter = extractNewLetter(ddbRecord);
  try {
    deps.logger.info({
      description: "Deleting pending letter",
      supplierId: letter.supplierId,
      letterId: letter.id,
    });
    await deps.letterQueueRepository.deleteLetter(letter.supplierId, letter.id);
    return true;
  } catch (error) {
    if (error instanceof LetterDoesNotExistError) {
      deps.logger.warn({
        description: "Letter does not exist",
        supplierId: letter.supplierId,
        letterId: letter.id,
      });
      return false;
    }
    throw error;
  }
}

function recordProcessing(
  deps: Deps,
  successCount: number,
  failureCount: number,
) {
  deps.logger.info({
    description: "Processing complete",
    successCount,
    failureCount,
    totalProcessed: successCount + failureCount,
  });

  deps.logger.info(buildMetric(MetricStatus.Success, successCount));
  deps.logger.info(buildMetric(MetricStatus.Failure, failureCount));
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
      description: "Processing Kinesis record",
      recordId: record.kinesis.sequenceNumber,
    });

    // Kinesis data is base64 encoded
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf8");
    deps.logger.info({ description: "Decoded payload", payload });

    const jsonParsed = JSON.parse(payload);
    deps.logger.info({ description: "Extracted dynamoDBRecord", jsonParsed });
    return jsonParsed;
  } catch (error) {
    deps.logger.error({
      description: "Error extracting payload",
      err: error,
      eventId: record.eventID,
    });
    throw error;
  }
}

function extractNewLetter(record: DynamoDBRecord): Letter {
  const newImage = record.dynamodb?.NewImage!;
  return LetterSchema.parse(unmarshall(newImage as any));
}

function mapLetterToPendingLetter(letter: Letter): InsertPendingLetter {
  return {
    supplierId: letter.supplierId,
    letterId: letter.id,
    specificationId: letter.specificationId,
    groupId: letter.groupId,
  };
}

function buildMetric(status: MetricStatus, count: number) {
  return buildEMFObject(
    "update-letter-queue",
    {},
    {
      key: status,
      value: count,
      unit: Unit.Count,
    },
  );
}
