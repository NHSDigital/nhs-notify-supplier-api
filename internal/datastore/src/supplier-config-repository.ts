import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $LetterVariant,
  $Supplier,
  $SupplierAllocation,
  $VolumeGroup,
  LetterVariant,
  Supplier,
  SupplierAllocation,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";

export type SupplierConfigRepositoryConfig = {
  supplierConfigTableName: string;
};

export class SupplierConfigRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly config: SupplierConfigRepositoryConfig,
  ) {}

  async getLetterVariant(variantId: string): Promise<LetterVariant> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.supplierConfigTableName,
        Key: { PK: "LETTER_VARIANT", SK: variantId },
      }),
    );
    if (!result.Item) {
      throw new Error(`No letter variant details found for id ${variantId}`);
    }

    return $LetterVariant.parse(result.Item);
  }

  async getVolumeGroup(groupId: string): Promise<VolumeGroup> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.supplierConfigTableName,
        Key: { PK: "VOLUME_GROUP", SK: groupId },
      }),
    );
    if (!result.Item) {
      throw new Error(`No volume group details found for id ${groupId}`);
    }
    return $VolumeGroup.parse(result.Item);
  }

  async getSupplierAllocationsForVolumeGroup(
    groupId: string,
  ): Promise<SupplierAllocation[]> {
    const result = await this.ddbClient.send(
      new QueryCommand({
        TableName: this.config.supplierConfigTableName,
        IndexName: "volumeGroup-index",
        KeyConditionExpression: "#pk = :pk AND #group = :groupId",
        FilterExpression: "#status = :status ",
        ExpressionAttributeNames: {
          "#pk": "PK",
          "#group": "volumeGroup",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":pk": "SUPPLIER_ALLOCATION",
          ":groupId": groupId,
          ":status": "PROD",
        },
      }),
    );
    if (!result.Items || result.Items.length === 0) {
      throw new Error(
        `No active supplier allocations found for volume group id ${groupId}`,
      );
    }

    return $SupplierAllocation.array().parse(result.Items);
  }

  async getSuppliersDetails(supplierIds: string[]): Promise<Supplier[]> {
    const suppliers: Supplier[] = [];
    for (const supplierId of supplierIds) {
      const result = await this.ddbClient.send(
        new GetCommand({
          TableName: this.config.supplierConfigTableName,
          Key: { PK: "SUPPLIER", SK: supplierId },
        }),
      );
      if (!result.Item) {
        throw new Error(`Supplier with id ${supplierId} not found`);
      }
      suppliers.push($Supplier.parse(result.Item));
    }
    return suppliers;
  }
}
