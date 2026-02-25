import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import {
  InsertPendingLetter,
  PendingLetter,
  PendingLetterSchema,
} from "./types";
import { LetterAlreadyExistsError } from "./errors";

type LetterQueueRepositoryConfig = {
  letterQueueTableName: string;
  letterQueueTtlHours: number;
};

export default class LetterQueueRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly log: Logger,
    readonly config: LetterQueueRepositoryConfig,
  ) {}

  async putLetter(
    insertPendingLetter: InsertPendingLetter,
  ): Promise<PendingLetter> {
    const pendingLetter: PendingLetter = {
      ...insertPendingLetter,
      // needs to be an ISO timestamp as Db sorts alphabetically
      queueTimestamp: new Date().toISOString(),
      ttl: Math.floor(
        Date.now() / 1000 + 60 * 60 * this.config.letterQueueTtlHours,
      ),
    };
    try {
      await this.ddbClient.send(
        new PutCommand({
          TableName: this.config.letterQueueTableName,
          Item: pendingLetter,
          ConditionExpression: "attribute_not_exists(letterId)", // Ensures the supplierId/letterId combination is unique
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        throw new LetterAlreadyExistsError(
          insertPendingLetter.supplierId,
          insertPendingLetter.letterId,
        );
      }
      throw error;
    }
    return PendingLetterSchema.parse(pendingLetter);
  }
}
