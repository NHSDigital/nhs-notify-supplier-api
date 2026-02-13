import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { Logger } from "pino";
import { z } from "zod";
import {
  InsertLetter,
  Letter,
  LetterBase,
  LetterSchema,
  LetterSchemaBase,
  UpdateLetter,
} from "./types";

export type PagingOptions = Partial<{
  exclusiveStartKey: Record<string, any>;
  pageSize: number;
}>;

const defaultPagingOptions = {
  pageSize: 50,
};

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
        throw new Error(
          `Letter with id ${letter.id} already exists for supplier ${letter.supplierId}`,
        );
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
      throw new Error(
        `Letter with id ${letterId} not found for supplier ${supplierId}`,
      );
    }
    return LetterSchema.parse(result.Item);
  }

  async getLettersByStatus(
    supplierId: string,
    status: Letter["status"],
    options?: PagingOptions,
  ): Promise<{
    letters: Letter[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    const extendedOptions = { ...defaultPagingOptions, ...options };

    const result = await this.ddbClient.send(
      new QueryCommand({
        TableName: this.config.lettersTableName,
        IndexName: "supplierStatus-index",
        KeyConditionExpression: "supplierStatus = :supplierStatus",
        ExpressionAttributeValues: {
          ":supplierStatus": `${supplierId}#${status}`,
        },
        Limit: extendedOptions.pageSize,
        ExclusiveStartKey: extendedOptions.exclusiveStartKey,
      }),
    );

    // Items is an empty array if no items match the query
    const letters = result
      .Items!.map((item) => LetterSchema.safeParse(item))
      .filter((letterItem) => {
        if (!letterItem.success) {
          this.log.warn(`Invalid letter data: ${letterItem.error}`);
        }
        return letterItem.success;
      })
      .map((successLetterItem) => successLetterItem.data);

    return {
      letters,
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
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

  async getLettersBySupplier(
    supplierId: string,
    status: string,
    limit: number,
  ): Promise<LetterBase[]> {
    const items: Record<string, any>[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined;
    const supplierStatus = `${supplierId}#${status}`;
    let res;

    do {
      const remaining = limit - items.length;

      res = await this.ddbClient.send(
        new QueryCommand({
          TableName: this.config.lettersTableName,
          IndexName: "supplierStatus-index",
          KeyConditionExpression: "supplierStatus = :supplierStatus",
          ExpressionAttributeNames: {
            "#status": "status", // reserved keyword
          },
          ExpressionAttributeValues: {
            ":supplierStatus": supplierStatus,
          },
          ProjectionExpression:
            "id, #status, specificationId, groupId, reasonCode, reasonText",
          Limit: remaining, // limit is a per-page cap
          ExclusiveStartKey,
        }),
      );

      if (res.Items?.length) {
        items.push(...res.Items);
      }

      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (res.LastEvaluatedKey && items.length < limit);

    return z.array(LetterSchemaBase).parse(items);
  }
}
