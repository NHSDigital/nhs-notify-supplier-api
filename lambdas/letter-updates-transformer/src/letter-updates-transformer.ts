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
import mapLetterToCloudEvent from "./mappers/letter-mapper";
import { Deps } from "./deps";
import { LetterSchemaWithSupplierId, LetterWithSupplierId } from "./types";

// SNS PublishBatchCommand supports up to 10 messages per batch
const BATCH_SIZE = 10;

export default function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return async (streamEvent: KinesisStreamEvent) => {
    deps.logger.info({ description: "Received event", streamEvent });

    const cloudEvents: LetterEvent[] = streamEvent.Records.map((record) =>
      extractPayload(record, deps),
    )
      .filter((record) => record.eventName === "MODIFY")
      .filter(
        (record) =>
          isChanged(record, "status") || isChanged(record, "reasonCode"),
      )
      .map((element) => extractNewLetter(element))
      .map((element) => mapLetterToCloudEvent(element));

    for (const batch of generateBatches(cloudEvents)) {
      deps.logger.info({ description: "Publishing batch", size: batch.length });
      await deps.snsClient.send(
        new PublishBatchCommand({
          TopicArn: deps.env.EVENTPUB_SNS_TOPIC_ARN,
          PublishBatchRequestEntries: batch.map((element, index) =>
            buildMessage(element, index),
          ),
        }),
      );
    }
  };
}

function extractPayload(
  record: KinesisStreamRecord,
  deps: Deps,
): DynamoDBRecord {
  // Kinesis data is base64 encoded
  const payload = Buffer.from(record.kinesis.data, "base64").toString("utf8");
  deps.logger.info({ description: "Extracted dynamoDBRecord", payload });
  return JSON.parse(payload);
}

function isChanged(record: DynamoDBRecord, property: string): boolean {
  const oldValue = record.dynamodb?.OldImage![property];
  const newValue = record.dynamodb?.NewImage![property];
  return oldValue?.S !== newValue?.S;
}

function extractNewLetter(record: DynamoDBRecord): LetterWithSupplierId {
  const newImage = record.dynamodb?.NewImage!;
  return LetterSchemaWithSupplierId.parse(unmarshall(newImage as any));
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
