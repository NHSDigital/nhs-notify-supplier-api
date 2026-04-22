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
    // Strip DynamoDB keys before parsing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pk, sk, ...item } = result.Item;
    return $OverallAllocation.parse(item);
  }

  async putOverallAllocation(allocation: OverallAllocation): Promise<void> {
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
    const currentAllocation = allocations[supplierId] ?? 0;
    const updatedAllocation = currentAllocation + newAllocation;

    if (overallAllocation) {
      // Update existing allocation
      const updatedAllocations = {
        ...allocations,
        [supplierId]: updatedAllocation,
      };
      await this.ddbClient.send(
        new UpdateCommand({
          TableName: this.config.supplierQuotasTableName,
          Key: { pk: "ENTITY#overall-allocation", sk: `ID#${groupId}` },
          UpdateExpression:
            "SET allocations = :allocations, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":allocations": updatedAllocations,
            ":updatedAt": new Date().toISOString(),
          },
        }),
      );
    } else {
      // Create new allocation
      const newOverallAllocation: OverallAllocation = {
        id: groupId,
        volumeGroup: groupId,
        allocations: { [supplierId]: updatedAllocation },
      };
      await this.putOverallAllocation(newOverallAllocation);
    }
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
    // Strip DynamoDB keys before parsing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pk, sk, ...item } = result.Item;
    return $DailyAllocation.parse(item);
  }

  async putDailyAllocation(allocation: DailyAllocation): Promise<void> {
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

    if (dailyAllocation) {
      // Update existing allocation
      const updatedAllocations = {
        ...allocations,
        [supplierId]: updatedAllocation,
      };
      await this.ddbClient.send(
        new UpdateCommand({
          TableName: this.config.supplierQuotasTableName,
          Key: {
            pk: "ENTITY#daily-allocation",
            sk: `ID#${groupId}#DATE#${date}`,
          },
          UpdateExpression:
            "SET allocations = :allocations, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":allocations": updatedAllocations,
            ":updatedAt": new Date().toISOString(),
          },
        }),
      );
    } else {
      // Create new allocation
      const newDailyAllocation: DailyAllocation = {
        id: `${groupId}#DATE#${date}`,
        date,
        volumeGroup: groupId,
        allocations: { [supplierId]: updatedAllocation },
      };
      await this.putDailyAllocation(newDailyAllocation);
    }
  }
}
