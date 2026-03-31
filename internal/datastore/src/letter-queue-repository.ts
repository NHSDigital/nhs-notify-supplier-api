import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import z from "zod";
import {
  InsertPendingLetter,
  PendingLetter,
  PendingLetterBase,
  PendingLetterSchema,
} from "./types";
import { LetterAlreadyExistsError } from "./letter-already-exists-error";
import { LetterDoesNotExistError } from "./letter-does-not-exist-error";

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

  private readonly defaultPriority = 10;

  async putLetter(
    insertPendingLetter: InsertPendingLetter,
  ): Promise<PendingLetter> {
    // needs to be an ISO timestamp as Db sorts alphabetically
    const now = new Date().toISOString();
    const priority = String(
      insertPendingLetter.priority ?? this.defaultPriority,
    );
    const queueSortOrderSk = `${priority.padStart(2, "0")}-${now}`;
    const pendingLetter: PendingLetter = {
      ...insertPendingLetter,
      queueTimestamp: now,
      visibilityTimestamp: now,
      queueSortOrderSk,
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

  async deleteLetter(supplierId: string, letterId: string): Promise<void> {
    try {
      await this.ddbClient.send(
        new DeleteCommand({
          TableName: this.config.letterQueueTableName,
          Key: { supplierId, letterId },
          ConditionExpression: "attribute_exists(letterId)",
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        throw new LetterDoesNotExistError(supplierId, letterId);
      }
      throw error;
    }
  }

  async getLetters(
    supplierId: string,
    limit: number,
  ): Promise<PendingLetter[]> {
    const result = await this.ddbClient.send(
      new QueryCommand({
        TableName: this.config.letterQueueTableName,
        IndexName: "queueSortOrder-index",
        KeyConditionExpression: "supplierId = :supplierId",
        FilterExpression: "visibilityTimestamp < :now",
        ExpressionAttributeValues: {
          ":supplierId": supplierId,
          ":now": new Date().toISOString(),
        },
        Limit: limit,
      }),
    );

    return z.array(PendingLetterSchema).parse(result.Items);
  }

  async updateVisibilityTimestamp(
    pendingLetter: PendingLetterBase,
    timestamp: Date,
  ): Promise<void> {
    try {
      await this.ddbClient.send(
        new UpdateCommand({
          TableName: this.config.letterQueueTableName,
          Key: {
            supplierId: pendingLetter.supplierId,
            letterId: pendingLetter.letterId,
          },
          UpdateExpression: "SET visibilityTimestamp = :ts",
          ConditionExpression: "attribute_exists(letterId)",
          ExpressionAttributeValues: {
            ":ts": timestamp.toISOString(),
          },
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        // Letter has been deleted from queue as no longer pending - just ignore it
        return;
      }
      throw error;
    }
  }
}
