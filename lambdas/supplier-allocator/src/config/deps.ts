import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
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
  logger: Logger;
  env: EnvVars;
  sqsClient: SQSClient;
};

function createDocumentClient(): DynamoDBDocumentClient {
  const ddbClient = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(ddbClient);
}

function createSupplierConfigRepository(
  log: Logger,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  envVars: EnvVars,
): SupplierConfigRepository {
  const config = {
    supplierConfigTableName: envVars.SUPPLIER_CONFIG_TABLE_NAME,
  };

  return new SupplierConfigRepository(createDocumentClient(), config);
}

function createSupplierQuotasRepository(
  log: Logger,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  envVars: EnvVars,
): SupplierQuotasRepository {
  const config = {
    supplierQuotasTableName: envVars.SUPPLIER_QUOTAS_TABLE_NAME,
  };

  return new SupplierQuotasRepository(createDocumentClient(), config);
}

export function createDependenciesContainer(): Deps {
  const log = createLogger({ logLevel: envVars.PINO_LOG_LEVEL });

  return {
    supplierConfigRepo: createSupplierConfigRepository(log, envVars),
    supplierQuotasRepo: createSupplierQuotasRepository(log, envVars),
    logger: log,
    env: envVars,
    sqsClient: new SQSClient({}),
  };
}
