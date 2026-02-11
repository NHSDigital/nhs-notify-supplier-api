import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import { SupplierRepository } from "@internal/datastore";
import { createLogger } from "@internal/helpers/src";
import { EnvVars, envVars } from "./env";

export type Deps = {
  supplierRepo: SupplierRepository;
  logger: Logger;
  env: EnvVars;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createSupplierRepository(
  documentClient: DynamoDBDocumentClient,
  log: Logger,
  suppliersTableName: string,
): SupplierRepository {
  const config = {
    suppliersTableName,
  };

  return new SupplierRepository(documentClient, log, config);
}

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

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
