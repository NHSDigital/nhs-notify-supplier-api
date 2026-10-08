import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import populateEntityCache, { EntityCacheDeps } from "../handler/entity-cache";

function makeDeps(ddbSend: jest.Mock, s3Send: jest.Mock): EntityCacheDeps {
  return {
    ddbClient: { send: ddbSend } as unknown as DynamoDBDocumentClient,
    s3Client: { send: s3Send } as unknown as S3Client,
    env: {
      SUPPLIER_CONFIG_TABLE_NAME: "config-table",
      EVENT_CACHE_BUCKET_NAME: "cache-bucket",
    },
  };
}

describe("populateEntityCache", () => {
  it("queries all pages for the entity and writes them to S3", async () => {
    const ddbSend = jest
      .fn()
      .mockResolvedValueOnce({
        Items: [{ pk: "ENTITY#supplier", sk: "ID#1" }],
        LastEvaluatedKey: { pk: "ENTITY#supplier", sk: "ID#1" },
      })
      .mockResolvedValueOnce({
        Items: [{ pk: "ENTITY#supplier", sk: "ID#2" }],
      });
    const s3Send = jest.fn().mockResolvedValue({});

    const count = await populateEntityCache(
      makeDeps(ddbSend, s3Send),
      "supplier",
    );

    expect(count).toBe(2);
    expect(ddbSend).toHaveBeenCalledTimes(2);
    const firstQuery = ddbSend.mock.calls[0][0] as QueryCommand;
    expect(firstQuery.input).toEqual({
      TableName: "config-table",
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": "ENTITY#supplier" },
      ExclusiveStartKey: undefined,
    });
    const secondQuery = ddbSend.mock.calls[1][0] as QueryCommand;
    expect(secondQuery.input.ExclusiveStartKey).toEqual({
      pk: "ENTITY#supplier",
      sk: "ID#1",
    });

    const put = s3Send.mock.calls[0][0] as PutObjectCommand;
    expect(put.input.Bucket).toBe("cache-bucket");
    expect(put.input.Key).toBe("supplier_config_cache/supplier.json");
    expect(JSON.parse(put.input.Body as string)).toEqual([
      { pk: "ENTITY#supplier", sk: "ID#1" },
      { pk: "ENTITY#supplier", sk: "ID#2" },
    ]);
  });

  it("writes an empty file when no rows are returned", async () => {
    const ddbSend = jest.fn().mockResolvedValue({});
    const s3Send = jest.fn().mockResolvedValue({});

    const count = await populateEntityCache(
      makeDeps(ddbSend, s3Send),
      "volume-group",
    );

    expect(count).toBe(0);
    const put = s3Send.mock.calls[0][0] as PutObjectCommand;
    expect(put.input.Key).toBe("supplier_config_cache/volume-group.json");
    expect(put.input.Body).toBe("[]");
  });
});
