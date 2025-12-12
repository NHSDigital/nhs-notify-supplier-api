import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import { z } from "zod";
import {
  InsertLetter,
  Letter,
  LetterBase,
  LetterSchema,
  LetterSchemaBase,
  UpdateLetter,
  UpsertLetter,
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
      supplierStatusSk: letter.createdAt, // needs to be an ISO timestamp
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

  async putLetterBatch(letters: InsertLetter[]): Promise<void> {
    let lettersDb: Letter[] = [];
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];

      if (letter) {
        lettersDb.push({
          ...letter,
          supplierStatus: `${letter.supplierId}#${letter.status}`,
          supplierStatusSk: letter.createdAt,
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
          supplierId,
          id: letterId,
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

  async updateLetterStatus(letterToUpdate: UpdateLetter): Promise<Letter> {
    this.log.debug(
      `Updating letter ${letterToUpdate.id} to status ${letterToUpdate.status}`,
    );
    let result: UpdateCommandOutput;
    try {
      let updateExpression =
        "set #status = :status, updatedAt = :updatedAt, supplierStatus = :supplierStatus, #ttl = :ttl";
      const expressionAttributeValues: Record<string, any> = {
        ":status": letterToUpdate.status,
        ":updatedAt": new Date().toISOString(),
        ":supplierStatus": `${letterToUpdate.supplierId}#${letterToUpdate.status}`,
        ":ttl": Math.floor(
          Date.now() / 1000 + 60 * 60 * this.config.lettersTtlHours,
        ),
      };

      if (letterToUpdate.reasonCode) {
        updateExpression += ", reasonCode = :reasonCode";
        expressionAttributeValues[":reasonCode"] = letterToUpdate.reasonCode;
      }

      if (letterToUpdate.reasonText) {
        updateExpression += ", reasonText = :reasonText";
        expressionAttributeValues[":reasonText"] = letterToUpdate.reasonText;
      }

      result = await this.ddbClient.send(
        new UpdateCommand({
          TableName: this.config.lettersTableName,
          Key: {
            supplierId: letterToUpdate.supplierId,
            id: letterToUpdate.id,
          },
          UpdateExpression: updateExpression,
          ConditionExpression: "attribute_exists(id)", // Ensure letter exists
          ExpressionAttributeNames: {
            "#status": "status",
            "#ttl": "ttl",
          },
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        throw new Error(
          `Letter with id ${letterToUpdate.id} not found for supplier ${letterToUpdate.supplierId}`,
        );
      }
      throw error;
    }

    this.log.debug(
      `Updated letter ${letterToUpdate.id} to status ${letterToUpdate.status}`,
    );
    return LetterSchema.parse(result.Attributes);
  }

  async getLettersBySupplier(
    supplierId: string,
    status: string,
    limit: number,
  ): Promise<LetterBase[]> {
    const supplierStatus = `${supplierId}#${status}`;
    const result = await this.ddbClient.send(
      new QueryCommand({
        TableName: this.config.lettersTableName,
        IndexName: "supplierStatus-index",
        KeyConditionExpression: "supplierStatus = :supplierStatus",
        Limit: limit,
        ExpressionAttributeNames: {
          "#status": "status", // reserved keyword
        },
        ExpressionAttributeValues: {
          ":supplierStatus": supplierStatus,
        },
        ProjectionExpression:
          "id, #status, specificationId, groupId, reasonCode, reasonText",
      }),
    );
    return z.array(LetterSchemaBase).parse(result.Items ?? []);
  }

  async upsertLetter(upsert: UpsertLetter): Promise<Letter> {
    const now = new Date();
    const ttl = Math.floor(
      now.valueOf() / 1000 + 60 * 60 * this.config.lettersTtlHours,
    );

    const setParts: string[] = [];
    const exprAttrNames: Record<string, string> = {};
    const exprAttrValues: Record<string, any> = {};

    // updateAt is always updated
    setParts.push("updatedAt = :updatedAt");
    exprAttrValues[":updatedAt"] = now.toISOString();

    // ttl is always updated
    setParts.push("#ttl = :ttl");
    exprAttrNames["#ttl"] = "ttl";
    exprAttrValues[":ttl"] = ttl;

    // createdAt only if first time
    setParts.push("createdAt = if_not_exists(createdAt, :createdAt)");
    exprAttrValues[":createdAt"] = now.toISOString();

    // status and related supplierStatus if provided
    if (upsert.status !== undefined) {
      exprAttrNames["#status"] = "status";
      setParts.push("#status = :status");
      exprAttrValues[":status"] = upsert.status;

      setParts.push("supplierStatus = :supplierStatus");
      exprAttrValues[":supplierStatus"] =
        `${upsert.supplierId}#${upsert.status}`;

      // supplierStatusSk should replicate createdAt
      setParts.push(
        "supplierStatusSk = if_not_exists(supplierStatusSk, :supplierStatusSk)",
      );
      exprAttrValues[":supplierStatusSk"] = now.toISOString();
    }

    // fields that could be updated

    if (upsert.specificationId !== undefined) {
      setParts.push("specificationId = :specificationId");
      exprAttrValues[":specificationId"] = upsert.specificationId;
    }

    if (upsert.url !== undefined) {
      setParts.push("#url = :url");
      exprAttrNames["#url"] = "url";
      exprAttrValues[":url"] = upsert.url;
    }

    if (upsert.groupId !== undefined) {
      setParts.push("groupId = :groupId");
      exprAttrValues[":groupId"] = upsert.groupId;
    }

    if (upsert.reasonCode !== undefined) {
      setParts.push("reasonCode = :reasonCode");
      exprAttrValues[":reasonCode"] = upsert.reasonCode;
    }
    if (upsert.reasonText !== undefined) {
      setParts.push("reasonText = :reasonText");
      exprAttrValues[":reasonText"] = upsert.reasonText;
    }

    if (upsert.source !== undefined) {
      setParts.push("#source = :source");
      exprAttrNames["#source"] = "source";
      exprAttrValues[":source"] = upsert.source;
    }

    const updateExpression = `SET ${setParts.join(", ")}`;

    const command = new UpdateCommand({
      TableName: this.config.lettersTableName,
      Key: { supplierId: upsert.supplierId, id: upsert.id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: "ALL_NEW",
    });

    const result = await this.ddbClient.send(command);

    if (!result.Attributes) {
      throw new Error("upsertLetter: no attributes returned");
    }

    this.log.debug({ exprAttrValues }, `Upsert to letter=${upsert.id}`);
    return LetterSchema.parse(result.Attributes);
  }
}
