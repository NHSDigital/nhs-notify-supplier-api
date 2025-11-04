import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import pino from 'pino';
import { envVars, EnvVars } from "./env";
import { SupplierRepository } from '@internal/datastore';

export type Deps = {
  supplierRepo: SupplierRepository;
  cloudWatchClient: CloudWatchClient;
  logger: pino.Logger;
  env: EnvVars;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createSupplierRepository(documentClient: DynamoDBDocumentClient, log: pino.Logger, envVars: EnvVars): SupplierRepository {
  const config = {
    suppliersTableName: envVars.SUPPLIERS_TABLE_NAME
  };

  return new SupplierRepository(documentClient, log, config);
}

export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    supplierRepo: createSupplierRepository(createDocumentClient(), log, envVars),
    cloudWatchClient: new CloudWatchClient({}),
    logger: log,
    env: envVars
  };
}
