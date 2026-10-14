import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createLogger } from "@internal/helpers";
import { EntityCacheDeps } from "./entity-cache";
import { envVars } from "./env";

export default function createDependenciesContainer(): EntityCacheDeps {
  return {
    ddbClient: DynamoDBDocumentClient.from(new DynamoDBClient()),
    s3Client: new S3Client(),
    logger: createLogger({ logLevel: envVars.PINO_LOG_LEVEL }),
    env: {
      SUPPLIER_CONFIG_TABLE_NAME: envVars.SUPPLIER_CONFIG_TABLE_NAME,
      EVENT_CACHE_BUCKET_NAME: envVars.EVENT_CACHE_BUCKET_NAME,
    },
  };
}
