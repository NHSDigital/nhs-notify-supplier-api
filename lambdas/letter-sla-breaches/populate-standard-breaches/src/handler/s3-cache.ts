import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import pino from "pino";

type JsonFetchFunction = () => Promise<unknown>;

const CACHE_KEY = "bank_holiday_cache/cache";

export default class S3Cache {
  constructor(
    private s3Client: S3Client,
    private s3Bucket: string,
    private logger: pino.Logger,
  ) {}

  private async writeCache(json: unknown): Promise<void> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: CACHE_KEY,
          Body: JSON.stringify(json),
          ContentType: "application/json",
        }),
      );
    } catch (error) {
      // A failure to cache shouldn't prevent the freshly fetched data being used
      this.logger.warn({
        err: error,
        description: "Failed to cache JSON in S3",
      });
    }
  }

  private async readCache(): Promise<unknown | undefined> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.s3Bucket,
          Key: CACHE_KEY,
        }),
      );
      const body = await response.Body?.transformToString();
      if (!body) {
        return undefined;
      }
      return JSON.parse(body);
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return undefined;
      }
      throw error;
    }
  }

  public cacheJson(fetchFunction: JsonFetchFunction): JsonFetchFunction {
    return async () => {
      let json: unknown;
      try {
        json = await fetchFunction();
        await this.writeCache(json);
      } catch (fetchError) {
        this.logger.warn({
          err: fetchError,
          description: "Failed to fetch JSON, falling back to cached value",
        });
        json = await this.readCache();
        if (!json) {
          throw new Error(
            "Failed to fetch JSON and no cached value is available",
            { cause: fetchError },
          );
        }
      }
      return json;
    };
  }
}
