import { MI } from "@internal/datastore";
import { DynamoDBStreamEvent, Handler } from "aws-lambda";
import { PutRecordCommand } from "@aws-sdk/client-kinesis";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { Deps } from "./deps";

export default function createHandler(
  deps: Deps,
): Handler<DynamoDBStreamEvent> {
  return async (event: DynamoDBStreamEvent): Promise<void> => {
    deps.logger.info({ description: "Received event", event });
    const insertedRecords = event.Records.filter(
      (record) => record.eventName === "INSERT",
    );

    for (const record of insertedRecords) {
      const newImage = record.dynamodb?.NewImage!;
      const miRecord = unmarshall(newImage as any) as MI;
      await deps.kinesisClient.send(
        new PutRecordCommand({
          StreamARN: deps.env.MI_CHANGE_STREAM_ARN,
          PartitionKey: miRecord.id,
          Data: Buffer.from(JSON.stringify(miRecord)),
        }),
      );
    }
  };
}
