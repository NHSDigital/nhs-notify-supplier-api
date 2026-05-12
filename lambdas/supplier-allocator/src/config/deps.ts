import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Logger } from "pino";
import { createLogger } from "@internal/helpers";
import {
  SupplierConfigRepository,
  SupplierQuotasRepository,
} from "@internal/datastore";
import { EnvVars, envVars } from "./env";

export type Deps = {
  supplierConfigRepo: SupplierConfigRepository;
  supplierQuotasRepo: SupplierQuotasRepository;
  idempotencyLayer: DynamoDBPersistenceLayer;
  logger: Logger;
  env: EnvVars;
  sqsClient: SQSClient;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createSupplierConfigRepository(): SupplierConfigRepository {
  const config = {
    supplierConfigTableName: envVars.SUPPLIER_CONFIG_TABLE_NAME,
  };

  return new SupplierConfigRepository(createDocumentClient(), config);
}

function createSupplierQuotasRepository(): SupplierQuotasRepository {
  const config = {
    supplierQuotasTableName: envVars.SUPPLIER_QUOTAS_TABLE_NAME,
  };

  return new SupplierQuotasRepository(createDocumentClient(), config);
}

function createIdempotencyLayer(): DynamoDBPersistenceLayer {
  return new DynamoDBPersistenceLayer({
    tableName: envVars.IDEMPOTENCY_TABLE_NAME,
  });
}

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

  return {
    supplierConfigRepo: createSupplierConfigRepository(),
    supplierQuotasRepo: createSupplierQuotasRepository(),
    idempotencyLayer: createIdempotencyLayer(),
    logger: log,
    env: envVars,
    sqsClient: new SQSClient({}),
  };
}
