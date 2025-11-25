import { LetterSchemaBase } from "@internal/datastore";
import { DynamoDBStreamEvent, DynamoDBRecord, DynamoDBStreamHandler } from "aws-lambda";
import { PutRecordCommand } from "@aws-sdk/client-kinesis";
import { Deps } from "./deps";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { LetterStatus } from "../../api-handler/src/contracts/letters";
import { Logger } from "pino";

const VALID_STATE_TRANSITIONS: Record<LetterStatus, Set<LetterStatus>> = {
  "PENDING": new Set(["ACCEPTED", "REJECTED"]),
  "REJECTED": new Set(["FAILED"]),
  "ACCEPTED": new Set(["FORWARDED", "PRINTED", "ENCLOSED", "DISPATCHED", "CANCELLED", "FAILED"]),
  "PRINTED": new Set(["ENCLOSED", "DISPATCHED", "CANCELLED", "FAILED"]),
  "ENCLOSED": new Set(["DISPATCHED", "CANCELLED", "FAILED"]),
  "FORWARDED": new Set(["DELIVERED", "RETURNED"]),
  "DISPATCHED": new Set(["DELIVERED", "RETURNED"]),
  "CANCELLED": new Set([]),
  "FAILED": new Set([]),
  "DELIVERED": new Set(["RETURNED"]),
  "RETURNED": new Set([]),
}

export function createHandler(deps: Deps): DynamoDBStreamHandler {
  return async (event: DynamoDBStreamEvent): Promise<void> => {
    deps.logger.info({description: "Received event", event});
    const statusChanges = event.Records
      .filter(record => record.eventName === "MODIFY")
      .filter(record =>
        (isChanged(record, "status") && isValidStateTransition(record, deps.logger)) ||
        isChanged(record, "reasonCode"));

    for (const record of statusChanges) {
      const newImage = record.dynamodb?.NewImage!;
      const letter = LetterSchemaBase.parse(unmarshall(newImage as any));
      await deps.kinesisClient.send(new PutRecordCommand({
        StreamARN: deps.env.LETTER_CHANGE_STREAM_ARN,
        PartitionKey: letter.id,
        Data: Buffer.from(JSON.stringify(letter)),
      }));
    }
  };

  function isValidStateTransition(record: DynamoDBRecord, logger: Logger): boolean {
    const oldStatus = record.dynamodb?.OldImage?.status?.S! as LetterStatus;
    const newStatus = record.dynamodb?.NewImage?.status?.S! as LetterStatus;
    const valid = VALID_STATE_TRANSITIONS[oldStatus].has(newStatus);
    if (!valid) {
      logger.warn({description: "Ignoring invalid state transition", oldStatus, newStatus});
    }
    return valid;
  }

  function isChanged(record: DynamoDBRecord, property: string): boolean {
    const oldValue = record.dynamodb?.OldImage![property];
    const newValue = record.dynamodb?.NewImage![property];
      return oldValue?.S !== newValue?.S;
  }
}
