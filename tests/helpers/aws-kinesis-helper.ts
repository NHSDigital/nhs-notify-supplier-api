import {
  GetRecordsCommand,
  GetRecordsCommandOutput,
  GetShardIteratorCommand,
  KinesisClient,
  ListShardsCommand,
  Shard,
  ShardIteratorType,
} from "@aws-sdk/client-kinesis";
import { AWS_REGION } from "tests/constants/api-constants";

export const kinesisClient = new KinesisClient({ region: AWS_REGION });

/**
 * Get all records from a given start time for the specified Kinesis Stream.
 * Any records before the given start time will be ignored
 *
 * @param streamARN - existing Kinesis stream ARN
 * @param startTimeMs - Start Time in milliseconds
 */
export async function retrieveKinesisRecordsAtTimestamp(
  streamARN: string,
  startTimeMs: number,
): Promise<number> {
  let recordsFound = 0;

  const shards: Shard[] = await getShards(streamARN);
  for (const shard of shards) {
    recordsFound += await getAllShardRecords(shard, streamARN, startTimeMs);
  }
  return recordsFound;
}

async function getShards(streamARN: string) {
  const shardsResp = await kinesisClient.send(
    new ListShardsCommand({ StreamARN: streamARN }),
  );
  const shards: Shard[] = shardsResp.Shards ?? [];
  if (shards.length === 0) {
    throw new Error(`No shards found for stream ${streamARN}`);
  }
  return shards;
}

async function getAllShardRecords(
  shard: Shard,
  streamARN: string,
  startTimeMs: number,
) {
  let shardRecords = 0;
  const iteratorResponse = await kinesisClient.send(
    new GetShardIteratorCommand({
      StreamARN: streamARN,
      ShardId: shard.ShardId,
      ShardIteratorType: ShardIteratorType.AT_TIMESTAMP,
      Timestamp: new Date(startTimeMs),
    }),
  );

  const shardIterator = iteratorResponse.ShardIterator;
  if (!shardIterator) {
    throw new Error("Failed to obtain shard iterator");
  }

  const recResp: GetRecordsCommandOutput = await kinesisClient.send(
    new GetRecordsCommand({
      ShardIterator: shardIterator,
      StreamARN: streamARN,
    }),
  );
  shardRecords += recResp.Records?.length ?? 0;

  return shardRecords;
}
