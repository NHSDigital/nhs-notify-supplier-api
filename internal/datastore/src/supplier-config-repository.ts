import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $LetterVariant,
  $PackSpecification,
  $Supplier,
  $SupplierAllocation,
  $SupplierPack,
  $VolumeGroup,
  LetterVariant,
  PackSpecification,
  Supplier,
  SupplierAllocation,
  SupplierPack,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { SupplierConfigEntity } from "./types";

export type SupplierConfigRepositoryConfig = {
  supplierConfigTableName: string;
};

const reservedWords = new Set(["name", "type", "status", "constraints"]);

export class SupplierConfigRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly config: SupplierConfigRepositoryConfig,
  ) {}

  async getLetterVariant(variantId: string): Promise<LetterVariant> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.supplierConfigTableName,
        Key: { pk: "ENTITY#letter-variant", sk: `ID#${variantId}` },
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
        Key: { pk: "ENTITY#volume-group", sk: `ID#${groupId}` },
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
          "#pk": "pk",
          "#group": "volumeGroup",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":pk": "ENTITY#supplier-allocation",
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
          Key: { pk: "ENTITY#supplier", sk: `ID#${supplierId}` },
        }),
      );
      if (!result.Item) {
        throw new Error(`Supplier with id ${supplierId} not found`);
      }
      suppliers.push($Supplier.parse(result.Item));
    }
    return suppliers;
  }

  async getSupplierPacksForPackSpecification(
    packSpecId: string,
  ): Promise<SupplierPack[]> {
    const result = await this.ddbClient.send(
      new QueryCommand({
        TableName: this.config.supplierConfigTableName,
        IndexName: "packSpecificationId-index",
        KeyConditionExpression: "#pk = :pk AND #packSpecId = :packSpecId",
        FilterExpression: "#status = :status AND #approval = :approval",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#packSpecId": "packSpecificationId",
          "#status": "status",
          "#approval": "approval",
        },
        ExpressionAttributeValues: {
          ":pk": "ENTITY#supplier-pack",
          ":packSpecId": packSpecId,
          ":status": "PROD",
          ":approval": "APPROVED",
        },
      }),
    );

    return $SupplierPack.array().parse(result.Items);
  }

  async getPackSpecification(packSpecId: string): Promise<PackSpecification> {
    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.supplierConfigTableName,
        Key: { pk: "ENTITY#pack-specification", sk: `ID#${packSpecId}` },
      }),
    );
    if (!result.Item) {
      throw new Error(`No pack specification found for id ${packSpecId}`);
    }
    return $PackSpecification.parse(result.Item);
  }

  async upsertSupplierConfig(
    entity: SupplierConfigEntity,
    supplierConfig: { id: string },
  ): Promise<"UPDATED" | "CREATED"> {
    const updateExpression =
      SupplierConfigRepository.buildUpdateExpression(supplierConfig);

    const result = await this.ddbClient.send(
      new UpdateCommand({
        TableName: this.config.supplierConfigTableName,
        Key: { pk: `ENTITY#${entity}`, sk: `ID#${supplierConfig.id}` },
        ...updateExpression,
        ReturnValues: "ALL_OLD",
      }),
    );
    return result.Attributes?.pk ? "UPDATED" : "CREATED";
  }

  static escapeReservedWord(key: string) {
    return reservedWords.has(key) ? `#${key}` : key;
  }

  static buildUpdateExpression(fieldsToUpdate: Record<string, any>) {
    const expressionAttributeNames = Object.fromEntries(
      Object.keys(fieldsToUpdate)
        .filter((key) => reservedWords.has(key))
        .map((key) => [`#${key}`, key]),
    );

    const expressionAttributeValues = Object.fromEntries(
      Object.entries(fieldsToUpdate).map(([key, value]) => [`:${key}`, value]),
    );

    const updateExpression = `set ${Object.keys(fieldsToUpdate)
      .map(
        (key) =>
          `${SupplierConfigRepository.escapeReservedWord(key)} = :${key}`,
      )
      .join(", ")}`;

    return {
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      UpdateExpression: updateExpression,
    };
  }
}
