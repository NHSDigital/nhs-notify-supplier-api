import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import { $LetterVariant, LetterVariant } from "./SupplierConfigDomain";

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
}
