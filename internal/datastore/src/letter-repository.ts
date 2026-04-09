import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { Logger } from "pino";
import {
  InsertLetter,
  Letter,
  LetterSchema,
  UpdateLetter,
} from "./types";
import LetterNotFoundError from "./errors/letter-not-found-error";
import LetterAlreadyExistsError from "./errors/letter-already-exists-error";

export type PagingOptions = Partial<{
  exclusiveStartKey: Record<string, any>;
  pageSize: number;
}>;

export type LetterRepositoryConfig = {
  lettersTableName: string;
  lettersTtlHours: number;
};

export class LetterRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly log: Logger,
    readonly config: LetterRepositoryConfig,
  ) {}

  async putLetter(letter: InsertLetter): Promise<Letter> {
    const letterDb: Letter = {
      ...letter,
      supplierStatus: `${letter.supplierId}#${letter.status}`,
      supplierStatusSk: new Date().toISOString(), // needs to be an ISO timestamp as Db sorts alphabetically
      ttl: Math.floor(
        Date.now() / 1000 + 60 * 60 * this.config.lettersTtlHours,
      ),
    };
    try {
      await this.ddbClient.send(
        new PutCommand({
          TableName: this.config.lettersTableName,
          Item: letterDb,
          ConditionExpression: "attribute_not_exists(id)", // Ensure id is unique
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        throw new LetterAlreadyExistsError(letter.supplierId, letter.id);
      }
      throw error;
    }
    return LetterSchema.parse(letterDb);
  }

  async unsafePutLetterBatch(letters: InsertLetter[]): Promise<void> {
    let lettersDb: Letter[] = [];
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];

      if (letter) {
        lettersDb.push({
          ...letter,
          supplierStatus: `${letter.supplierId}#${letter.status}`,
          supplierStatusSk: new Date().toISOString(), // needs to be an ISO timestamp as Db sorts alphabetically
          ttl: Math.floor(
            Date.now() / 1000 + 60 * 60 * this.config.lettersTtlHours,
          ),
        });
      }

      if (lettersDb.length === 25 || i === letters.length - 1) {
        const input = {
          RequestItems: {
            [this.config.lettersTableName]: lettersDb.map((item: any) => ({
              PutRequest: {
                Item: item,
              },
            })),
          },
        };

        await this.ddbClient.send(new BatchWriteCommand(input));

        lettersDb = [];
      }
    }
  }

  async getLetterById(supplierId: string, letterId: string): Promise<Letter> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.lettersTableName,
        Key: {
          id: letterId,
          supplierId,
        },
      }),
    );

    if (!result.Item) {
      throw new LetterNotFoundError(supplierId, letterId);
    }
    return LetterSchema.parse(result.Item);
  }

  async updateLetterStatus(
    letterToUpdate: UpdateLetter,
  ): Promise<Letter | undefined> {
    this.log.debug(
      `Updating letter ${letterToUpdate.id} to status ${letterToUpdate.status}`,
    );
    let result: UpdateCommandOutput;
    try {
      const { expressionAttributeValues, updateExpression } =
        this.buildUpdateExpression(letterToUpdate);

      result = await this.ddbClient.send(
        new UpdateCommand({
          TableName: this.config.lettersTableName,
          Key: {
            id: letterToUpdate.id,
            supplierId: letterToUpdate.supplierId,
          },
          UpdateExpression: updateExpression,
          ConditionExpression:
            "attribute_exists(id) AND (attribute_not_exists(eventId) OR eventId <> :eventId)",
          ExpressionAttributeNames: {
            "#status": "status",
            "#ttl": "ttl",
          },
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
          ReturnValuesOnConditionCheckFailure: "ALL_OLD",
        }),
      );

      this.log.debug(
        `Updated letter ${letterToUpdate.id} to status ${letterToUpdate.status}`,
      );
      return LetterSchema.parse(result.Attributes);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        if (error.Item?.eventId.S === letterToUpdate.eventId) {
          this.log.warn(
            `Skipping update for letter ${letterToUpdate.id}: eventId ${letterToUpdate.eventId} already processed`,
          );
          return undefined;
        }
        throw new Error(
          `Letter with id ${letterToUpdate.id} not found for supplier ${letterToUpdate.supplierId}`,
        );
      }
      throw error;
    }
  }

  private buildUpdateExpression(letterToUpdate: UpdateLetter) {
    let updateExpression = `set #status = :status, previousStatus = #status, updatedAt = :updatedAt, supplierStatus = :supplierStatus,
                                #ttl = :ttl, eventId = :eventId`;
    const expressionAttributeValues: Record<string, any> = {
      ":status": letterToUpdate.status,
      ":updatedAt": new Date().toISOString(),
      ":supplierStatus": `${letterToUpdate.supplierId}#${letterToUpdate.status}`,
      ":ttl": Math.floor(
        Date.now() / 1000 + 60 * 60 * this.config.lettersTtlHours,
      ),
      ":eventId": letterToUpdate.eventId,
    };

    if (letterToUpdate.reasonCode) {
      updateExpression += ", reasonCode = :reasonCode";
      expressionAttributeValues[":reasonCode"] = letterToUpdate.reasonCode;
    }

    if (letterToUpdate.reasonText) {
      updateExpression += ", reasonText = :reasonText";
      expressionAttributeValues[":reasonText"] = letterToUpdate.reasonText;
    }
    return { updateExpression, expressionAttributeValues };
  }
}
