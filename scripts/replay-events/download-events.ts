import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import * as readline from "node:readline";
import { Readable } from "node:stream";

const BUCKET = process.env.BUCKET;
const PREFIX = "2026/03/";
const MIN_NUMBER = 25;
const OUTPUT_DIR = "events-output";

const s3 = new S3Client({});

function shouldIncludeKey(key: string): boolean {
  const match = key.match(/^2026\/03\/(\d+)(?:\/|$)/);
  if (!match) return false;
  return Number(match[1]) >= MIN_NUMBER;
}

function keyToFilename(key: string): string {
  return key.replaceAll("/", "_").replace(/\.jsonl$/, "") + ".json";
}

async function listMatchingKeys(): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: PREFIX,
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of resp.Contents ?? []) {
      if (obj.Key && shouldIncludeKey(obj.Key)) {
        keys.push(obj.Key);
      }
    }

    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  keys.sort();
  return keys;
}

async function* readJsonlObjects(key: string): AsyncGenerator<any> {
  const resp = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  if (!resp.Body) return;

  const bodyStream =
    resp.Body instanceof Readable ? resp.Body : Readable.fromWeb(resp.Body as any);

  const rl = readline.createInterface({
    input: bodyStream,
    crlfDelay: Infinity,
  });

  try {
    for await (const rawLine of rl) {
      const line = String(rawLine).trim();
      if (!line) continue;

      const outer = JSON.parse(line);

      if (outer?.Message === undefined) {
        continue;
      }

      const messageValue = JSON.parse(outer.Message);

      yield messageValue;
    }
  } finally {
    rl.close();
  }
}

async function downloadKey(key: string): Promise<void> {
  const filename = `${OUTPUT_DIR}/${keyToFilename(key)}`;
  const messages: any[] = [];

  for await (const message of readJsonlObjects(key)) {
    if (
      message.detail && 
      message.detail.type === "uk.nhs.notify.letter-rendering.letter-request.prepared.v2" &&
      message.detail.time >= '2026-03-26T12:00:00.000Z' &&
      message.detail.time <= '2026-03-27T15:10:00.000Z'
    ) {
      messages.push(message.detail);
    }
  }
  if (messages.length > 0) {
    await writeFile(filename, JSON.stringify(messages, null, 2) + "\n");
    console.log(`Wrote ${filename} (${messages.length} messages)`);
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const keys = await listMatchingKeys();
  console.log(`Found ${keys.length} matching S3 objects`);

  for (const key of keys) {
    await downloadKey(key);
  }

  console.log(`Done — files written to ${OUTPUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});