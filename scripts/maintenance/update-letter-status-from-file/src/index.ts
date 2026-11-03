import {
  WriteStream,
  createWriteStream,
  mkdirSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { Logger, pino } from "pino";
import { LetterRepository, LetterStatusType } from "@internal/datastore";

// --- Hardcoded parameters for this one-off run ---
const TABLE_NAME = "nhs-main-supapi-letters";
const SUPPLIER_ID = "cds";
const CURRENT_STATUS: LetterStatusType = "ACCEPTED";
const NEW_STATUS: LetterStatusType = "FORWARDED";
const LETTERS_TTL_HOURS = 12_960;
const CONCURRENCY = 5;
const REASON_CODE: string | undefined = undefined;
const REASON_TEXT: string | undefined = undefined;

const SCRIPT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const INPUT_FILE = path.join(SCRIPT_DIR, "data", "letter.ids");
const OUTPUT_DIR = path.join(SCRIPT_DIR, "output");

function outputFilePaths(timestamp: string) {
  return {
    updatedIdsFile: path.join(
      OUTPUT_DIR,
      `updated-letter-ids-${timestamp}.txt`,
    ),
    failedIdsFile: path.join(OUTPUT_DIR, `failed-letter-ids-${timestamp}.txt`),
  };
}

function parseDryRunArg(): boolean {
  return process.argv.includes("--dry-run");
}

async function logTargetAccount(logger: Logger, dryRun: boolean) {
  const stsClient = new STSClient({});
  const identity = await stsClient.send(new GetCallerIdentityCommand({}));

  logger.info({
    description: "Target run configuration",
    account: identity.Account,
    arn: identity.Arn,
    region: await stsClient.config.region(),
    tableName: TABLE_NAME,
    supplierId: SUPPLIER_ID,
    currentStatus: CURRENT_STATUS,
    newStatus: NEW_STATUS,
    inputFile: INPUT_FILE,
    dryRun,
  });

  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
}

async function main() {
  const logger = pino();
  const dryRun = parseDryRunArg();
  const letterIds = readFileSync(INPUT_FILE, "utf8")
    .split(/\r?\n/)
    .map((id) => id.trim())
    .filter(Boolean);

  await logTargetAccount(logger, dryRun);

  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const letterRepo = new LetterRepository(docClient, logger, {
    lettersTableName: TABLE_NAME,
    lettersTtlHours: LETTERS_TTL_HOURS,
  });

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const { failedIdsFile, updatedIdsFile } = outputFilePaths(timestamp);
  const updatedIdsStream = createWriteStream(updatedIdsFile);
  const failedIdsStream = createWriteStream(failedIdsFile);

  let updatedCount = 0;
  let failedCount = 0;

  async function processLetterId(id: string) {
    try {
      const letter = await letterRepo.getLetterById(SUPPLIER_ID, id);
      if (letter.status !== CURRENT_STATUS) {
        failedCount += 1;
        failedIdsStream.write(`${id}\n`);
        logger.warn({
          description: "Letter has unexpected current status",
          id,
          currentStatus: letter.status,
          expectedStatus: CURRENT_STATUS,
        });
        return;
      }

      if (!dryRun) {
        const updated = await letterRepo.updateLetterStatus({
          id,
          supplierId: SUPPLIER_ID,
          status: NEW_STATUS,
          eventId: randomUUID(),
          reasonCode: REASON_CODE,
          reasonText: REASON_TEXT,
        });
        if (!updated) {
          failedCount += 1;
          failedIdsStream.write(`${id}\n`);
          logger.warn({ description: "Letter update was skipped", id });
          return;
        }
      }

      updatedCount += 1;
      updatedIdsStream.write(`${id}\n`);
    } catch (error) {
      failedCount += 1;
      failedIdsStream.write(`${id}\n`);
      logger.error({ description: "Failed to update letter", id, err: error });
    }

    if ((updatedCount + failedCount) % 100 === 0) {
      logger.info({
        description: "Progress",
        processedCount: updatedCount + failedCount,
        updatedCount,
        failedCount,
      });
    }
  }

  for (let index = 0; index < letterIds.length; index += CONCURRENCY) {
    await Promise.all(
      letterIds
        .slice(index, index + CONCURRENCY)
        .map((id) => processLetterId(id)),
    );
  }

  await closeStream(updatedIdsStream);
  await closeStream(failedIdsStream);

  logger.info({
    description: dryRun ? "DRY RUN complete" : "Run complete",
    inputCount: letterIds.length,
    updatedCount,
    failedCount,
    updatedIdsFile,
    failedIdsFile,
  });
}

function closeStream(stream: WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.end((error: Error | null | undefined) =>
      error ? reject(error) : resolve(),
    );
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
