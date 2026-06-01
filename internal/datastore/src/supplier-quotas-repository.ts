import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $DailyAllocation,
  $OverallAllocation,
  DailyAllocation,
  OverallAllocation,
} from "./types";

export type SupplierQuotasRepositoryConfig = {
  supplierQuotasTableName: string;
};

export class SupplierQuotasRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly config: SupplierQuotasRepositoryConfig,
  ) {}

  async getOverallAllocation(
    groupId: string,
  ): Promise<OverallAllocation | undefined> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.supplierQuotasTableName,
        Key: { pk: "ENTITY#overall-allocation", sk: `ID#${groupId}` },
      }),
    );
    if (!result.Item) {
      return undefined;
    }
    // Strip DynamoDB keys before parsing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pk, sk, ...item } = result.Item;
    return $OverallAllocation.parse(item);
  }

  private static isValidationException(err: unknown): boolean {
    return err instanceof Error && err.name === "ValidationException";
  }

  private static isConditionalCheckFailed(err: unknown): boolean {
    return (
      err instanceof Error && err.name === "ConditionalCheckFailedException"
    );
  }

  async updateOverallAllocation(
    groupId: string,
    supplierId: string,
    newAllocation: number,
  ): Promise<void> {
    const now = new Date().toISOString();

    const key = {
      pk: "ENTITY#overall-allocation",
      sk: `ID#${groupId}`,
    };

    const increment = async () => {
      await this.ddbClient.send(
        new UpdateCommand({
          TableName: this.config.supplierQuotasTableName,
          Key: key,
          UpdateExpression: `
          SET
            allocations.#supplierId = if_not_exists(allocations.#supplierId, :zero) + :delta,
            id = if_not_exists(id, :groupId),
            volumeGroup = if_not_exists(volumeGroup, :groupId),
            createdAt = if_not_exists(createdAt, :now),
            updatedAt = :now
        `,
          ExpressionAttributeNames: {
            "#supplierId": supplierId,
          },
          ExpressionAttributeValues: {
            ":zero": 0,
            ":delta": newAllocation,
            ":groupId": groupId,
            ":now": now,
          },
        }),
      );
    };

    try {
      await increment();
      return;
    } catch (error) {
      if (!SupplierQuotasRepository.isValidationException(error)) {
        throw error;
      }
    }

    try {
      await this.ddbClient.send(
        new PutCommand({
          TableName: this.config.supplierQuotasTableName,
          Item: {
            ...key,
            id: groupId,
            volumeGroup: groupId,
            allocations: {
              [supplierId]: newAllocation,
            },
            createdAt: now,
            updatedAt: now,
          },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
      return;
    } catch (error) {
      if (!SupplierQuotasRepository.isConditionalCheckFailed(error)) {
        throw error;
      }
    }

    // Another writer created the item first; retry the atomic increment.
    await increment();
  }

  async getDailyAllocation(date: string): Promise<DailyAllocation | undefined> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.supplierQuotasTableName,
        Key: {
          pk: "ENTITY#daily-allocation",
          sk: `ID#${date}`,
        },
      }),
    );
    if (!result.Item) {
      return undefined;
    }
    // Strip DynamoDB keys before parsing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pk, sk, ...item } = result.Item;
    return $DailyAllocation.parse(item);
  }

  async updateDailyAllocation(
    allocationDate: string,
    supplierId: string,
    newAllocation: number,
  ): Promise<void> {
    const now = new Date().toISOString();

    const key = {
      pk: "ENTITY#daily-allocation",
      sk: `ID#${allocationDate}`,
    };

    const increment = async () => {
      await this.ddbClient.send(
        new UpdateCommand({
          TableName: this.config.supplierQuotasTableName,
          Key: key,
          UpdateExpression: `
          SET
            allocations.#supplierId = if_not_exists(allocations.#supplierId, :zero) + :delta,
            id = if_not_exists(id, :id),
            #date = if_not_exists(#date, :date),
            createdAt = if_not_exists(createdAt, :now),
            updatedAt = :now
        `,
          ExpressionAttributeNames: {
            "#supplierId": supplierId,
            "#date": "date",
          },
          ExpressionAttributeValues: {
            ":zero": 0,
            ":delta": newAllocation,
            ":id": `ID#${allocationDate}`,
            ":date": allocationDate,
            ":now": now,
          },
        }),
      );
    };

    try {
      await increment();
      return;
    } catch (error) {
      if (!SupplierQuotasRepository.isValidationException(error)) {
        throw error;
      }
    }

    try {
      await this.ddbClient.send(
        new PutCommand({
          TableName: this.config.supplierQuotasTableName,
          Item: {
            ...key,
            id: `ID#${allocationDate}`,
            date: allocationDate,
            allocations: {
              [supplierId]: newAllocation,
            },
            createdAt: now,
            updatedAt: now,
          },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
      return;
    } catch (error) {
      if (!SupplierQuotasRepository.isConditionalCheckFailed(error)) {
        throw error;
      }
    }

    // Another request created the item first, so retry the atomic increment.
    await increment();
  }
}
