import { NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import pino from "pino";
import S3Cache from "../handler/s3-cache";

const mockJson = {
  "england-and-wales": {
    events: [{ date: "2026-05-04" }],
  },
};

const s3Client = {
  send: jest.fn(),
} as unknown as S3Client;
const logger = { info: jest.fn(), warn: jest.fn() } as unknown as pino.Logger;

function cachedObject(json: unknown) {
  return {
    Body: { transformToString: () => Promise.resolve(JSON.stringify(json)) },
  };
}

describe("s3-cache", () => {
  it("caches the fetched JSON in S3", async () => {
    (s3Client.send as jest.Mock).mockResolvedValue({});
    const s3Cache = new S3Cache(s3Client, "reporting-bucket", logger);
    const cachingFunction = s3Cache.cacheJson(async () => mockJson);

    const result = await cachingFunction();

    expect(result).toEqual(mockJson);
    expect(s3Client.send).toHaveBeenCalledTimes(1);
    const put = (s3Client.send as jest.Mock).mock
      .calls[0][0] as PutObjectCommand;
    expect(put).toBeInstanceOf(PutObjectCommand);
    expect(put.input).toEqual({
      Bucket: "reporting-bucket",
      Key: "bank_holiday_cache/cache",
      Body: JSON.stringify(mockJson),
      ContentType: "application/json",
    });
  });

  it("still returns the fetched JSON if caching fails", async () => {
    (s3Client.send as jest.Mock).mockRejectedValue(new Error("S3 down"));
    const s3Cache = new S3Cache(s3Client, "reporting-bucket", logger);
    const cachingFunction = s3Cache.cacheJson(async () => mockJson);

    const result = await cachingFunction();

    expect(result).toEqual(mockJson);
    expect(logger.warn).toHaveBeenCalledWith({
      err: new Error("S3 down"),
      description: "Failed to cache JSON in S3",
    });
  });

  it("falls back to the cached value when the fetch fails", async () => {
    (s3Client.send as jest.Mock).mockResolvedValue(cachedObject(mockJson));
    const s3Cache = new S3Cache(s3Client, "reporting-bucket", logger);
    const cachingFunction = s3Cache.cacheJson(async () => {
      throw new Error("failed");
    });

    const result = await cachingFunction();

    expect(result).toEqual(mockJson);
    expect(logger.warn).toHaveBeenCalledWith({
      err: new Error("failed"),
      description: "Failed to fetch JSON, falling back to cached value",
    });
  });

  it("throws if the fetch fails and there is no cached value", async () => {
    (s3Client.send as jest.Mock).mockRejectedValue(
      new NoSuchKey({ message: "missing", $metadata: {} }),
    );
    const s3Cache = new S3Cache(s3Client, "reporting-bucket", logger);
    const cachingFunction = s3Cache.cacheJson(async () => {
      throw new Error("failed");
    });

    await expect(cachingFunction()).rejects.toThrow(
      "Failed to fetch JSON and no cached value is available",
    );
  });

  it("throws if the fetch fails and the cached object is empty", async () => {
    (s3Client.send as jest.Mock).mockResolvedValue({});

    const s3Cache = new S3Cache(s3Client, "reporting-bucket", logger);
    const cachingFunction = s3Cache.cacheJson(async () => {
      throw new Error("failed");
    });

    await expect(cachingFunction()).rejects.toThrow(
      "Failed to fetch JSON and no cached value is available",
    );
  });

  it("propagates other errors reading the cache", async () => {
    (s3Client.send as jest.Mock).mockRejectedValue(new Error("Access denied"));

    const s3Cache = new S3Cache(s3Client, "reporting-bucket", logger);
    const cachingFunction = s3Cache.cacheJson(async () => {
      throw new Error("failed");
    });

    await expect(cachingFunction()).rejects.toThrow("Access denied");
  });
});
