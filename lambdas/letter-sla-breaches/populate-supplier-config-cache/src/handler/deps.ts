import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EntityCacheDeps } from "./entity-cache";

export default function createDependenciesContainer(): EntityCacheDeps {
  return {
    ddbClient: DynamoDBDocumentClient.from(new DynamoDBClient()),
    s3Client: new S3Client(),
    env: {
      SUPPLIER_CONFIG_TABLE_NAME: process.env.SUPPLIER_CONFIG_TABLE_NAME!,
      EVENT_CACHE_BUCKET_NAME: process.env.EVENT_CACHE_BUCKET_NAME!,
    },
  };
}
