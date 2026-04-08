import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { SNSClient, PublishBatchCommand } from "@aws-sdk/client-sns";

const INPUT_DIR = "events-output";
const TOPIC_ARN = "nhs-main-supapi-eventsub";
const BATCH_SIZE = 10;

const sns = new SNSClient({});

async function publishBatch(entries: any[]): Promise<void> {
  const resp = await sns.send(
    new PublishBatchCommand({
      TopicArn: TOPIC_ARN,
      PublishBatchRequestEntries: entries.map((message) => ({
        Id: randomUUID(),
        Message: JSON.stringify(message),
      })),
    })
  );

  if (resp.Failed && resp.Failed.length > 0) {
    console.error("Failed entries:", resp.Failed);
    throw new Error(`${resp.Failed.length} messages failed to publish`);
  }
}

async function replayFile(filePath: string): Promise<number> {
  const messages: any[] = JSON.parse(await readFile(filePath, "utf8"));
  let sent = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    await publishBatch(batch);
    sent += batch.length;
  }

  return sent;
}

async function main() {
  const files = await readdir(INPUT_DIR);

  console.log(`Found ${files.length} files in ${INPUT_DIR}/`);

  let totalSent = 0;

  for (const file of files) {
    const filePath = `${INPUT_DIR}/${file}`;
    const sent = await replayFile(filePath);
    totalSent += sent;
    console.log(`Replayed ${filePath} (${sent} messages)`);
  }

  console.log(`Done — sent ${totalSent} messages total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});