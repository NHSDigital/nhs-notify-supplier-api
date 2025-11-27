import { LetterBase } from "@internal/datastore";
import { DynamoDBStreamEvent, Handler, DynamoDBRecord, AttributeValue } from "aws-lambda";
import { PutRecordCommand } from "@aws-sdk/client-kinesis";
import { Deps } from "./deps";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export function createHandler(deps: Deps): Handler<DynamoDBStreamEvent> {
  return async (event: DynamoDBStreamEvent): Promise<void> => {
    const statusChanges = event.Records
      .filter(record => record.eventName === "MODIFY")
      .filter(record => isChanged(record, 'status') || isChanged(record, 'reasonCode'));

    for (const record of statusChanges) {
      const newImage = record.dynamodb?.NewImage!;
      const letter = unmarshall(newImage as any) as LetterBase;
      await deps.kinesisClient.send(new PutRecordCommand({
        StreamName: deps.env.LETTER_CHANGE_STREAM_NAME,
        PartitionKey: letter.id,
        Data: Buffer.from(JSON.stringify(letter)),
      }));
    }
  };

  function isChanged(record: DynamoDBRecord, property: string): boolean {
    const oldValue = record.dynamodb?.OldImage![property];
    const newValue = record.dynamodb?.NewImage![property];
      return oldValue?.S !== newValue?.S;
  }
}
