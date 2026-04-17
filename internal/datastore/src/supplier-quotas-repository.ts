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

function ItemForRecord(
  entity: string,
  id: string,
  record: Record<string, any>,
): Record<string, any> {
  return {
    pk: `ENTITY#${entity}`,
    sk: `ID#${id}`,
    ...record,
  };
}

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
    return $OverallAllocation.parse(result.Item);
  }

  async putOverallAllocation(allocation: OverallAllocation): Promise<void> {
    try {
      const parsedAllocation = $OverallAllocation.parse(allocation);
      await this.ddbClient.send(
        new PutCommand({
          TableName: this.config.supplierQuotasTableName,
          Item: ItemForRecord(
            "overall-allocation",
            allocation.id,
            parsedAllocation,
          ),
        }),
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to put overall allocation for id ${allocation.id}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  // Update the overallAllocation table updating the allocations array for a given volume group
  // or adding the value if the supplier is not present //
  async updateOverallAllocation(
    groupId: string,
    supplierId: string,
    newAllocation: number,
  ): Promise<void> {
    const overallAllocation = await this.getOverallAllocation(groupId);
    const allocations = overallAllocation?.allocations ?? {};
    const currentAllocation = Object.hasOwn(allocations, supplierId)
      ? allocations[supplierId]
      : 0;
    const updatedAllocation = currentAllocation + newAllocation;

    await this.ddbClient.send(
      new UpdateCommand({
        TableName: this.config.supplierQuotasTableName,
        Key: { pk: "ENTITY#overall-allocation", sk: `ID#${groupId}` },
        UpdateExpression:
          "SET allocations.#supplierId = :updatedAllocation, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#supplierId": supplierId,
        },
        ExpressionAttributeValues: {
          ":updatedAllocation": updatedAllocation,
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );
  }

  async getDailyAllocation(
    groupId: string,
    date: string,
  ): Promise<DailyAllocation | undefined> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.supplierQuotasTableName,
        Key: {
          pk: "ENTITY#daily-allocation",
          sk: `ID#${groupId}#DATE#${date}`,
        },
      }),
    );
    if (!result.Item) {
      return undefined;
    }
    return $DailyAllocation.parse(result.Item);
  }

  async putDailyAllocation(allocation: DailyAllocation): Promise<void> {
    try {
      const parsedAllocation = $DailyAllocation.parse(allocation);
      await this.ddbClient.send(
        new PutCommand({
          TableName: this.config.supplierQuotasTableName,
          Item: ItemForRecord(
            "daily-allocation",
            `${allocation.volumeGroup}#DATE#${allocation.date}`,
            parsedAllocation,
          ),
        }),
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to put daily allocation for volume group ${allocation.volumeGroup} and date ${allocation.date}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async updateDailyAllocation(
    groupId: string,
    date: string,
    supplierId: string,
    newAllocation: number,
  ): Promise<void> {
    const dailyAllocation = await this.getDailyAllocation(groupId, date);
    const allocations = dailyAllocation?.allocations ?? {};
    const currentAllocation = allocations[supplierId] ?? 0;
    const updatedAllocation = currentAllocation + newAllocation;

    await this.ddbClient.send(
      new UpdateCommand({
        TableName: this.config.supplierQuotasTableName,
        Key: {
          pk: "ENTITY#daily-allocation",
          sk: `ID#${groupId}#DATE#${date}`,
        },
        UpdateExpression:
          "SET allocations.#supplierId = :updatedAllocation, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#supplierId": supplierId,
        },
        ExpressionAttributeValues: {
          ":updatedAllocation": updatedAllocation,
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );
  }
}
