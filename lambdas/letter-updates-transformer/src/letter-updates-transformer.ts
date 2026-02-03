import {
  DynamoDBRecord,
  Handler,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  PublishBatchCommand,
  PublishBatchRequestEntry,
} from "@aws-sdk/client-sns";
import { LetterEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { MetricsLogger, Unit, metricScope } from "aws-embedded-metrics";
import mapLetterToCloudEvent from "./mappers/letter-mapper";
import { Deps } from "./deps";
import { LetterForEventPub, LetterSchemaForEventPub } from "./types";

// SNS PublishBatchCommand supports up to 10 messages per batch
const BATCH_SIZE = 10;

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return metricScope((metrics: MetricsLogger) => {
    return async (streamEvent: KinesisStreamEvent) => {
      deps.logger.info({ description: "Received event", streamEvent });
      deps.logger.info({
        description: "Number of records",
        count: streamEvent.Records?.length || 0,
      });

      // Ensure logging by extracting all records first
      const ddbRecords: DynamoDBRecord[] = streamEvent.Records.map((record) =>
        extractPayload(record, deps),
      );

      const cloudEvents: LetterEvent[] = ddbRecords
        .filter((record) => filterRecord(record, deps))
        .map((element) => extractNewLetter(element))
        .map((element) =>
          mapLetterToCloudEvent(element, deps.env.EVENT_SOURCE),
        );

      const eventTypeCount: Map<string, number> =
        populateEventTypeMap(cloudEvents);
      // const eventTypeCount = new Map<string, number>();
      for (const batch of generateBatches(cloudEvents)) {
        deps.logger.info({
          description: "Publishing batch",
          size: batch.length,
          letterEvents: batch,
        });
        await deps.snsClient.send(
          new PublishBatchCommand({
            TopicArn: deps.env.EVENTPUB_SNS_TOPIC_ARN,
            PublishBatchRequestEntries: batch.map((element, index) =>
              buildMessage(element, index),
            ),
          }),
        );
      }
      emitMetrics(metrics, eventTypeCount);
    };
  });
}

function populateEventTypeMap(cloudEvents: LetterEvent[]) {
  const evtMap = new Map<string, number>();
  for (const event of cloudEvents) {
    evtMap.set(event.type, (evtMap.get(event.type) || 0) + 1);
  }
  return evtMap;
}

function emitMetrics(
  metrics: MetricsLogger,
  eventTypeCount: Map<string, number>,
) {
  metrics.setNamespace(
    process.env.AWS_LAMBDA_FUNCTION_NAME || "letter-updates-transformer",
  );
  for (const [type, count] of eventTypeCount) {
    metrics.putDimensions({
      eventType: type,
    });
    metrics.putMetric("events published", count, Unit.Count);
  }
}

function filterRecord(record: DynamoDBRecord, deps: Deps): boolean {
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

  deps.logger.info({
    description: "Filtering record",
    eventName: record.eventName,
    eventId: record.eventID,
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
      error,
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

function extractNewLetter(record: DynamoDBRecord): LetterForEventPub {
  const newImage = record.dynamodb?.NewImage!;
  return LetterSchemaForEventPub.parse(unmarshall(newImage as any));
}

function* generateBatches(events: LetterEvent[]) {
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    yield events.slice(i, i + BATCH_SIZE);
  }
}

function buildMessage(
  event: LetterEvent,
  index: number,
): PublishBatchRequestEntry {
  return {
    Id: `${event.id}-${index}`,
    Message: JSON.stringify(event),
  };
}
