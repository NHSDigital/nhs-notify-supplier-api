import { Handler, KinesisStreamEvent, KinesisStreamRecord } from "aws-lambda";
import { MI } from "@internal/datastore";
import {
  PublishBatchCommand,
  PublishBatchRequestEntry,
} from "@aws-sdk/client-sns";
import { MISubmittedEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
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

function extractPayload(record: KinesisStreamRecord, deps: Deps): MI {
  const payload = Buffer.from(record.kinesis.data, "base64").toString("utf8");
  deps.logger.info({ description: "Extracted payload", payload });
  return JSON.parse(payload);
}

export function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return async (streamEvent: KinesisStreamEvent) => {
    deps.logger.info({ description: "Received event", streamEvent });

    const cloudEvents: MISubmittedEvent[] = streamEvent.Records
      .map((record) => extractPayload(record, deps))
      .map((payload) => mapMIToCloudEvent(payload, deps));

    for (const batch of generateBatches(cloudEvents)) {
      await deps.snsClient.send(
        new PublishBatchCommand({
          TopicArn: deps.env.EVENTPUB_SNS_TOPIC_ARN,
          PublishBatchRequestEntries: batch.map((element) =>
            buildMessage(element, deps),
          ),
        }),
      );
    }
  };
}
