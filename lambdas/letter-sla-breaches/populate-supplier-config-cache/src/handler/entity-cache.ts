import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";

export type EntityCacheDeps = {
  ddbClient: DynamoDBDocumentClient;
  s3Client: S3Client;
  env: {
    SUPPLIER_CONFIG_TABLE_NAME: string;
    EVENT_CACHE_BUCKET_NAME: string;
  };
};

export const CACHE_FOLDER = "supplier_config_cache";

export default async function populateEntityCache(
  deps: EntityCacheDeps,
  entityType: string,
): Promise<number> {
  const items: Record<string, unknown>[] = [];
  let exclusiveStartKey: QueryCommandOutput["LastEvaluatedKey"];

  do {
    const page: QueryCommandOutput = await deps.ddbClient.send(
      new QueryCommand({
        TableName: deps.env.SUPPLIER_CONFIG_TABLE_NAME,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": `ENTITY#${entityType}` },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    items.push(...(page.Items ?? []));
    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey);

  await deps.s3Client.send(
    new PutObjectCommand({
      Bucket: deps.env.EVENT_CACHE_BUCKET_NAME,
      Key: `${CACHE_FOLDER}/${entityType}.json`,
      Body: JSON.stringify(items),
      ContentType: "application/json",
    }),
  );

  return items.length;
}
