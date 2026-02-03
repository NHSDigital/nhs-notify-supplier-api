import {
  DynamoDBRecord,
  Handler,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { MI, MISchema } from "@internal/datastore";
import {
  PublishBatchCommand,
  PublishBatchRequestEntry,
} from "@aws-sdk/client-sns";
import { MISubmittedEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { MetricsLogger, Unit, metricScope } from "aws-embedded-metrics";
import { mapMIToCloudEvent } from "./mappers/mi-mapper";
import { Deps } from "./deps";

// SNS PublishBatchCommand supports up to 10 messages per batch
const BATCH_SIZE = 10;

function* generateBatches(events: MISubmittedEvent[]) {
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    yield events.slice(i, i + BATCH_SIZE);
  }
}

function buildMessage(
  event: MISubmittedEvent,
  deps: Deps,
): PublishBatchRequestEntry {
  const message = {
    Id: event.id,
    Message: JSON.stringify(event),
  };
  deps.logger.info({ description: "Built message", message });
  return message;
}

function extractPayload(
  record: KinesisStreamRecord,
  deps: Deps,
): DynamoDBRecord {
  const payload = Buffer.from(record.kinesis.data, "base64").toString("utf8");
  deps.logger.info({ description: "Extracted payload", payload });
  return JSON.parse(payload);
}

function extractMIData(record: DynamoDBRecord): MI {
  const newImage = record.dynamodb?.NewImage!;
  return MISchema.parse(unmarshall(newImage as any));
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

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return metricScope((metrics: MetricsLogger) => {
    return async (streamEvent: KinesisStreamEvent) => {
      deps.logger.info({ description: "Received event", streamEvent });

      const cloudEvents: MISubmittedEvent[] = streamEvent.Records.map(
        (record) => extractPayload(record, deps),
      )
        .filter((record) => record.eventName === "INSERT")
        .map((element) => extractMIData(element))
        .map((payload) => mapMIToCloudEvent(payload, deps));

      const eventTypeCount = new Map<string, number>();
      for (const batch of generateBatches(cloudEvents)) {
        await deps.snsClient.send(
          new PublishBatchCommand({
            TopicArn: deps.env.EVENTPUB_SNS_TOPIC_ARN,
            PublishBatchRequestEntries: batch.map((element) => {
              eventTypeCount.set(
                element.type,
                (eventTypeCount.get(element.type) || 0) + 1,
              );
              return buildMessage(element, deps);
            }),
          }),
        );
      }
      emitMetrics(metrics, eventTypeCount);
    };
  });
}
