import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import pino from "pino";
import { SupplierRepository } from "@internal/datastore";
import { EnvVars, envVars } from "./env";

export type Deps = {
  supplierRepo: SupplierRepository;
  logger: pino.Logger;
  env: EnvVars;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createSupplierRepository(
  documentClient: DynamoDBDocumentClient,
  log: pino.Logger,
  suppliersTableName: string,
): SupplierRepository {
  const config = {
    suppliersTableName,
  };

  return new SupplierRepository(documentClient, log, config);
}

export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    supplierRepo: createSupplierRepository(
      createDocumentClient(),
      log,
      envVars.SUPPLIERS_TABLE_NAME,
    ),
    logger: log,
    env: envVars,
  };
}
