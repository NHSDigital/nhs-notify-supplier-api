import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { pino } from "pino";
import { SupplierRepository } from "@internal/datastore";

export function createSupplierRepository(
  environment: string,
): SupplierRepository {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const log = pino();
  const config = {
    suppliersTableName: `nhs-${environment}-supapi-suppliers`,
  };

  return new SupplierRepository(docClient, log, config);
}
