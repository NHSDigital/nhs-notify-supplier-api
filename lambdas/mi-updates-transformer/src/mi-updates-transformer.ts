
import { Handler, KinesisStreamEvent } from 'aws-lambda';
import { mapMIToCloudEvent } from './mappers/mi-mapper';
import { PublishBatchCommand, PublishBatchRequestEntry } from '@aws-sdk/client-sns';
import { MISubmittedEvent } from '@nhsdigital/nhs-notify-event-schemas-supplier-api/src';
import { Deps } from './deps';
// SNS PublishBatchCommand supports up to 10 messages per batch
const BATCH_SIZE = 10;

export function createHandler(deps: Deps): Handler<KinesisStreamEvent> {
  return async(streamEvent: KinesisStreamEvent) => {
    deps.logger.info({description: 'Received event', streamEvent});

    const cloudEvents: MISubmittedEvent[] = streamEvent.Records
      .map((record) => {
        // Kinesis data is base64 encoded
        const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
        return JSON.parse(payload);
      })
      .map(mapMIToCloudEvent);


    for (let batch of generateBatches(cloudEvents)) {
      await deps.snsClient.send(new PublishBatchCommand({
        TopicArn: deps.env.EVENT_PUB_SNS_TOPIC_ARN,
        PublishBatchRequestEntries: batch.map(buildMessage),
      }));
    }
  }

  function* generateBatches(events: MISubmittedEvent[]) {
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      yield events.slice(i, i + BATCH_SIZE);
    }
  }

  function buildMessage(event: MISubmittedEvent): PublishBatchRequestEntry {
    return {
      Id: event.id,
      Message: JSON.stringify(event),
    }
  }
}
