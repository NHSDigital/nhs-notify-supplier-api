import { MI } from "@internal/datastore";
import { DynamoDBStreamEvent, Handler } from "aws-lambda";
import { PutRecordCommand } from "@aws-sdk/client-kinesis";
import { Deps } from "./deps";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export function createHandler(deps: Deps): Handler<DynamoDBStreamEvent> {
  return async (event: DynamoDBStreamEvent): Promise<void> => {
    const insertedRecords = event.Records
      .filter(record => record.eventName === "INSERT");

    for (const record of insertedRecords) {
      const newImage = record.dynamodb?.NewImage!;
      const miRecord = unmarshall(newImage as any) as MI;
      await deps.kinesisClient.send(new PutRecordCommand({
        StreamName: deps.env.MI_CHANGE_STREAM_NAME,
        PartitionKey: miRecord.id,
        Data: Buffer.from(JSON.stringify(miRecord)),
      }));
    }
  };
}
