import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import LogRefs from "../log-references";

export type EntityCacheDeps = {
  ddbClient: DynamoDBDocumentClient;
  s3Client: S3Client;
  logger: Logger;
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
  deps.logger.info({
    logRef: LogRefs.LOADING_ENTITY.code,
    description: LogRefs.LOADING_ENTITY.description,
    entityType,
  });

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

  deps.logger.info({
    logRef: LogRefs.LOADED_ENTITY.code,
    description: LogRefs.LOADED_ENTITY.description,
    entityType,
    itemCount: items.length,
    hasItems: items.length > 0,
  });

  const key = `${CACHE_FOLDER}/${entityType}/records.json`;
  await deps.s3Client.send(
    new PutObjectCommand({
      Bucket: deps.env.EVENT_CACHE_BUCKET_NAME,
      Key: key,
      Body: items.map((item) => JSON.stringify(item)).join("\n"),
      ContentType: "application/json",
    }),
  );

  deps.logger.info({
    logRef: LogRefs.CACHE_FILE_CREATED.code,
    description: LogRefs.CACHE_FILE_CREATED.description,
    entityType,
    itemCount: items.length,
    bucket: deps.env.EVENT_CACHE_BUCKET_NAME,
    key,
    s3Uri: `s3://${deps.env.EVENT_CACHE_BUCKET_NAME}/${key}`,
  });

  return items.length;
}
