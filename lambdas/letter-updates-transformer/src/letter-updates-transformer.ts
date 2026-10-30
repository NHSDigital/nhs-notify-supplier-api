import {
  DynamoDBRecord,
  Handler,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  PublishBatchCommand,
  PublishBatchCommandOutput,
  PublishBatchRequestEntry,
} from "@aws-sdk/client-sns";
import { LetterStatusChangeEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { MetricEntry, buildEMFObject } from "@internal/helpers";
import { Letter, LetterSchema } from "@internal/datastore";
import { mapLetterToCloudEvent } from "@internal/event-builders/src";
import { Unit } from "aws-embedded-metrics";
import pino from "pino";
import { Deps } from "./deps";
import LogRefs from "./log-references";

// SNS PublishBatchCommand supports up to 10 messages per batch
const BATCH_SIZE = 10;

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return async (streamEvent: KinesisStreamEvent) => {
    // Ensure logging by extracting all records first
    const ddbRecords: DynamoDBRecord[] = streamEvent.Records.map((record) =>
      extractPayload(record, deps),
    );

    const cloudEvents: LetterStatusChangeEvent[] = ddbRecords
      .filter((record) => filterRecord(record))
      .map((element) => extractNewLetter(element))
      .map((element) => mapLetterToCloudEvent(element, deps.env.EVENT_SOURCE));

    const eventTypeCount: Map<string, number> =
      populateEventTypeMap(cloudEvents);
    for (const batch of generateBatches(cloudEvents)) {
      const response: PublishBatchCommandOutput = await deps.snsClient.send(
        new PublishBatchCommand({
          TopicArn: deps.env.EVENTPUB_SNS_TOPIC_ARN,
          PublishBatchRequestEntries: batch.map((element, index) =>
            buildMessage(element, index),
          ),
        }),
      );

      // PublishBatch returns 200 with a Failed list, so throw to make Kinesis retry
      const failed = response.Failed ?? [];
      if (failed.length > 0) {
        deps.logger.error({
          logRef: LogRefs.ERROR_PUBLISHING_BATCH.code,
          description: LogRefs.ERROR_PUBLISHING_BATCH.description,
          failedCount: failed.length,
          failed,
        });
        throw new Error(`SNS PublishBatch failed for ${failed.length} entries`);
      }
    }
    emitMetrics(deps.logger, eventTypeCount);
    deps.logger.info({
      logRef: LogRefs.NUMBER_OF_RECORDS.code,
      description: LogRefs.NUMBER_OF_RECORDS.description,
      total: streamEvent.Records?.length || 0,
      passed: cloudEvents.length,
    });
  };
}

function populateEventTypeMap(cloudEvents: LetterStatusChangeEvent[]) {
  const evtMap = new Map<string, number>();
  for (const event of cloudEvents) {
    evtMap.set(event.type, (evtMap.get(event.type) || 0) + 1);
  }
  return evtMap;
}

function emitMetrics(logger: pino.Logger, eventTypeCount: Map<string, number>) {
  const namespace = "letter-updates-transformer";
  for (const [type, count] of eventTypeCount) {
    const dimensions: Record<string, string> = { eventType: type };
    const metric: MetricEntry = {
      key: "Events published",
      value: count,
      unit: Unit.Count,
    };
    const emf = buildEMFObject(namespace, dimensions, metric);
    logger.info({ ...emf, logRef: LogRefs.METRIC.code });
  }
}

function filterRecord(record: DynamoDBRecord): boolean {
  let allowEvent = false;
  if (record.eventName === "INSERT") {
    allowEvent = true;
  }

  if (
    record.eventName === "MODIFY" &&
    (isChanged(record, "status") || isChanged(record, "reasonCode"))
  ) {
    allowEvent = true;
  }

  return allowEvent;
}

function extractPayload(
  record: KinesisStreamRecord,
  deps: Deps,
): DynamoDBRecord {
  try {
    // Kinesis data is base64 encoded
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf8");
    const jsonParsed = JSON.parse(payload);
    return jsonParsed;
  } catch (error) {
    deps.logger.error({
      logRef: LogRefs.ERROR_EXTRACTING_PAYLOAD.code,
      description: LogRefs.ERROR_EXTRACTING_PAYLOAD.description,
      err: error,
      record,
    });
    throw error;
  }
}

function isChanged(record: DynamoDBRecord, property: string): boolean {
  const oldValue = record.dynamodb?.OldImage![property];
  const newValue = record.dynamodb?.NewImage![property];
  return oldValue?.S !== newValue?.S;
}

function extractNewLetter(record: DynamoDBRecord): Letter {
  const newImage = record.dynamodb?.NewImage!;
  return LetterSchema.parse(unmarshall(newImage as any));
}

function* generateBatches(events: LetterStatusChangeEvent[]) {
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    yield events.slice(i, i + BATCH_SIZE);
  }
}

function buildMessage(
  event: LetterStatusChangeEvent,
  index: number,
): PublishBatchRequestEntry {
  return {
    Id: `${event.id}-${index}`,
    Message: JSON.stringify(event),
  };
}
