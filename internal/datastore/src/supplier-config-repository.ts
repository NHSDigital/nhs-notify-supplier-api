import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import {
  $LetterVariant,
  $SupplierAllocation,
  $VolumeGroup,
  LetterVariant,
  SupplierAllocation,
  VolumeGroup,
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
    this.log.info({
      description:
        "Fetching supplier allocations for volume group from database",
      groupId,
    });
    const result = await this.ddbClient.send(
      new QueryCommand({
        TableName: this.config.supplierConfigTableName,
        IndexName: "volumeGroup-index",
        KeyConditionExpression: "#pk = :pk AND #group = :groupId",
        ExpressionAttributeNames: {
          "#pk": "PK", // make sure this is the GSI's PK attribute name
          "#group": "volumeGroup", // <-- use the **actual** GSI key name
        },
        ExpressionAttributeValues: {
          ":pk": "SUPPLIER_ALLOCATION",
          ":groupId": groupId,
        },
      }),
    );
    this.log.info({
      description:
        "Fetched supplier allocations for volume group from database",
      groupId,
      count: result.Items?.length ?? 0,
    });
    if (!result.Items) {
      throw new Error(
        `No supplier allocations found for volume group id ${groupId}`,
      );
    }
    return $SupplierAllocation.array().parse(result.Items);
  }
}
