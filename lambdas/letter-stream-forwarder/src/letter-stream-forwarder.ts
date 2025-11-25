import { LetterBase } from "@internal/datastore";
import { DynamoDBStreamEvent, Handler } from "aws-lambda";
import { PutRecordCommand } from "@aws-sdk/client-kinesis";
import { Deps } from "./deps";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export function createHandler(deps: Deps): Handler<DynamoDBStreamEvent> {
  return async (event: DynamoDBStreamEvent): Promise<void> => {
    const statusChanges = event.Records
      .filter(record => record.eventName === "MODIFY")
      .filter(record => {
        const oldStatus = record.dynamodb?.OldImage?.status?.S;
        const newStatus = record.dynamodb?.NewImage?.status?.S;
        return oldStatus !== newStatus;
      });

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
}
