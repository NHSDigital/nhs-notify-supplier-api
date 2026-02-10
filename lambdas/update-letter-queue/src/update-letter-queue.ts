import {
  DynamoDBRecord,
  Handler,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { MetricsLogger, Unit, metricScope } from "aws-embedded-metrics";
import {
  InsertPendingLetter,
  Letter,
  LetterAlreadyExistsError,
  LetterSchema,
} from "@internal/datastore";
import { Deps } from "./deps";

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return metricScope((metrics: MetricsLogger) => {
    return async (streamEvent: KinesisStreamEvent) => {
      let successCount = 0;

      deps.logger.info({ description: "Received event", streamEvent });
      deps.logger.info({
        description: "Number of records",
        count: streamEvent.Records?.length || 0,
      });

      const ddbRecords: DynamoDBRecord[] = streamEvent.Records.map((record) =>
        extractPayload(record, deps),
      );

      const newPendingLetters = ddbRecords
        .filter((record) => filterRecord(record, deps))
        .map((element) => extractNewLetter(element))
        .map((element) => mapLetterToPendingLetter(element));

      for (const pendingLetter of newPendingLetters) {
        try {
          deps.logger.info({
            description: "Persisting pending letter",
            pendingLetter,
          });
          await deps.letterQueueRepository.putLetter(pendingLetter);
          successCount += 1;
        } catch (error) {
          if (error instanceof LetterAlreadyExistsError) {
            deps.logger.warn({
              description: "Letter already exists",
              supplierId: pendingLetter.supplierId,
              letterId: pendingLetter.letterId,
            });
          } else {
            deps.logger.error({
              description: "Error persisting pending letter",
              error,
              pendingLetter,
            });
            recordProcessing(deps, successCount, 1, metrics);
            // If we get a failure, return immediately without processing the remaining records. Since we are
            // working with a Kinesis stream, AWS will retry from the point of failure and no records will be lost.
            // See https://docs.aws.amazon.com/lambda/latest/dg/example_serverless_Kinesis_Lambda_batch_item_failures_section.html
            return {
              batchItemFailures: [{ itemIdentifier: pendingLetter.letterId }],
            };
          }
        }
      }

      recordProcessing(deps, successCount, 0, metrics);
      return { batchItemFailures: [] };
    };
  });
}

function recordProcessing(
  deps: Deps,
  successCount: number,
  failureCount: number,
  metrics: MetricsLogger,
) {
  deps.logger.info({
    description: "Processing complete",
    successCount,
    failureCount,
    totalProcessed: successCount + failureCount,
  });

  emitMetrics(metrics, successCount, failureCount);
}

function emitMetrics(
  metrics: MetricsLogger,
  successCount: number,
  failureCount: number,
) {
  metrics.setNamespace(
    process.env.AWS_LAMBDA_FUNCTION_NAME || "update-letter-queue",
  );
  metrics.putMetric("letters queued successfully", successCount, Unit.Count);
  metrics.putMetric("letters queued failed", failureCount, Unit.Count);
}

function filterRecord(record: DynamoDBRecord, deps: Deps): boolean {
  const isInsert = record.eventName === "INSERT";
  const newImage = record.dynamodb?.NewImage;
  const isPending = newImage?.status?.S === "PENDING";

  const allowEvent = isInsert && isPending;

  deps.logger.info({
    description: "Filtering record",
    eventName: record.eventName,
    eventId: record.eventID,
    status: newImage?.status?.S,
    allowEvent,
  });

  return allowEvent;
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
