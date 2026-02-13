import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import { createHash } from "node:crypto";
import {
  InsertPendingLetter,
  PendingLetter,
  PendingLetterSchema,
} from "./types";

type LetterQueueRepositoryConfig = {
  letterQueueTableName: string;
  letterQueueTtlHours: number;
};

export function createSha256Hash(
  letter: Omit<PendingLetter, "sha256hash" | "ttl">,
): string {
  // Use an array so that hash does not depend on insertion order
  const dataToHash = JSON.stringify([
    letter.groupId,
    letter.letterId,
    letter.queueTimestamp,
    letter.specificationId,
    letter.supplierId,
  ]);
  return createHash("sha256").update(dataToHash).digest("hex");
}

export default class LetterQueueRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly log: Logger,
    readonly config: LetterQueueRepositoryConfig,
  ) {}

  async putLetter(
    insertPendingLetter: InsertPendingLetter,
  ): Promise<PendingLetter> {
    const queueTimestamp = new Date().toISOString();
    const letterWithTimestamp = {
      ...insertPendingLetter,
      queueTimestamp, // needs to be an ISO timestamp as Db sorts alphabetically
    };
    const pendingLetter: PendingLetter = {
      ...letterWithTimestamp,
      sha256hash: createSha256Hash(letterWithTimestamp),
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
        throw new Error(
          `Letter with id ${pendingLetter.letterId} already exists for supplier ${pendingLetter.supplierId}`,
        );
      }
      throw error;
    }
    return PendingLetterSchema.parse(pendingLetter);
  }
}
