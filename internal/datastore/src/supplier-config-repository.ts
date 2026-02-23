import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import {
  $LetterVariant,
  LetterVariant,
  $VolumeGroup,
  VolumeGroup,
  $SupplierAllocation,
  SupplierAllocation,
} from "./SupplierConfigDomain";

export type SupplierConfigRepositoryConfig = {
  supplierConfigTableName: string;
};

export class SupplierConfigRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly log: Logger,
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
      throw new Error(`Letter variant with id ${variantId} not found`);
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
      throw new Error(`Volume group with id ${groupId} not found`);
    }
    return $VolumeGroup.parse(result.Item);
  }

  async getSupplierAllocationsForVolumeGroup(
    groupId: string,
  ): Promise<SupplierAllocation[]> {
    const result = await this.ddbClient.send(
      new QueryCommand({
        TableName: this.config.supplierConfigTableName,
        IndexName: "VolumeGroupIndex",
        KeyConditionExpression: "PK = :pk AND volumeGroup = :groupId",
        ExpressionAttributeValues: {
          ":pk": "SUPPLIER_ALLOCATIONS",
          ":groupId": groupId,
        },
      }),
    );
    if (!result.Item) {
      throw new Error(
        `Supplier allocations for volume group with id ${groupId} not found`,
      );
    }
    return $SupplierAllocation.array().parse(result.Item.items);
  }
}
