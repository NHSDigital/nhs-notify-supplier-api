import { WriteStream, createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { Logger, pino } from "pino";
import { LetterRepository } from "@internal/datastore";

// --- Hardcoded parameters for this one-off run: change these values directly rather than passing them as args ---
const TABLE_NAME = "nhs-main-supapi-letters";
const SUPPLIER_ID = "xerox";
const STATUS = "PENDING";
const START_DATE = "2026-09-02";
const END_DATE = "2026-09-05";
const SPECIFICATION_ID = "digitrials-ofh";
const CONCURRENCY = 5;
const LETTERS_TTL_HOURS = 12_960; // unused by touchLetter, required by LetterRepositoryConfig

const OUTPUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "output",
);

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
  const arg = process.argv.find((value) => value.startsWith("--dry-run="));
  if (!arg) {
    return true;
  }
  return arg.split("=")[1] !== "false";
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
    dryRun,
  });
}

async function main() {
  const logger = pino();
  const dryRun = parseDryRunArg();

  await logTargetAccount(logger, dryRun);

  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const letterRepo = new LetterRepository(docClient, logger, {
    lettersTableName: TABLE_NAME,
    lettersTtlHours: LETTERS_TTL_HOURS,
  });

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const { failedIdsFile, updatedIdsFile } = outputFilePaths(
    new Date().toISOString().replaceAll(/[:.]/g, "-"),
  );
  const updatedIdsStream = createWriteStream(updatedIdsFile);
  const failedIdsStream = createWriteStream(failedIdsFile);

  let matchedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  async function processLetter(letter: { id: string; supplierId: string }) {
    if (dryRun) {
      return;
    }

    try {
      await letterRepo.touchLetter(letter.supplierId, letter.id);
      updatedCount += 1;
      updatedIdsStream.write(`${letter.id}\n`);
    } catch (error) {
      errorCount += 1;
      failedIdsStream.write(`${letter.id}\n`);
      logger.error({
        description: "Failed to update letter",
        id: letter.id,
        supplierId: letter.supplierId,
        err: error,
      });
    }

    if ((updatedCount + errorCount) % 100 === 0) {
      logger.info({
        description: "Progress",
        matchedCount,
        updatedCount,
        errorCount,
      });
    }
  }

  const matches = letterRepo.queryLettersBySupplierStatus(
    SUPPLIER_ID,
    STATUS,
    START_DATE,
    END_DATE,
    SPECIFICATION_ID,
  );

  let batch = [];
  for await (const letter of matches) {
    matchedCount += 1;
    batch.push(letter);

    if (batch.length === CONCURRENCY) {
      await Promise.all(batch.map((item) => processLetter(item)));
      batch = [];
    }
  }
  if (batch.length > 0) {
    await Promise.all(batch.map((item) => processLetter(item)));
  }

  await closeStream(updatedIdsStream);
  await closeStream(failedIdsStream);

  logger.info({
    description: dryRun ? "DRY RUN complete" : "Run complete",
    matchedCount,
    updatedCount,
    errorCount,
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
