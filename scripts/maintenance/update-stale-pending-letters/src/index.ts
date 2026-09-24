import { WriteStream, createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { Logger, pino } from "pino";
import { LetterRepository, LetterStatusType } from "@internal/datastore";

// --- Hardcoded parameters for this one-off run: change these values directly rather than passing them as args ---
const TABLE_NAME = "nhs-main-supapi-letters";
const SUPPLIER_ID = "supplier-placeholder";
const STATUS = "PENDING";
const START_DATE = "2026-09-02";
const END_DATE = "2026-09-05T23:59:59.999Z";
const SPECIFICATION_ID = "specification-placeholder";
const CONCURRENCY = 5;
const LETTERS_TTL_HOURS = 12_960; // unused by touchLetter, required by LetterRepositoryConfig

// Switches the per-letter action: bump updatedAt only, or transition to NEW_STATUS
const ACTION: "TOUCH" | "UPDATE_STATUS" = "TOUCH";
const NEW_STATUS: LetterStatusType = "FAILED";
const REASON_CODE: string | undefined = undefined;
const REASON_TEXT: string | undefined = undefined;

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
    action: ACTION,
    newStatus: ACTION === "UPDATE_STATUS" ? NEW_STATUS : undefined,
    dryRun,
  });

  // Give the operator a window to abort if the logged account/table is wrong
  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
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
  let skippedCount = 0;

  /** Returns false if the letter was skipped (eventId already processed), true otherwise. */
  async function applyAction(letter: {
    id: string;
    supplierId: string;
  }): Promise<boolean> {
    if (ACTION === "TOUCH") {
      await letterRepo.touchLetter(letter.supplierId, letter.id);
      return true;
    }

    const updated = await letterRepo.updateLetterStatus({
      id: letter.id,
      supplierId: letter.supplierId,
      status: NEW_STATUS,
      eventId: randomUUID(),
      reasonCode: REASON_CODE,
      reasonText: REASON_TEXT,
    });

    return updated !== undefined;
  }

  async function processLetter(letter: { id: string; supplierId: string }) {
    if (dryRun) {
      updatedCount += 1;
      updatedIdsStream.write(`${letter.id}\n`);
    } else {
      try {
        const applied = await applyAction(letter);
        if (applied) {
          updatedCount += 1;
          updatedIdsStream.write(`${letter.id}\n`);
        } else {
          skippedCount += 1;
          logger.warn({
            description: "Skipped letter: eventId already processed",
            id: letter.id,
            supplierId: letter.supplierId,
          });
        }
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
    }

    if ((updatedCount + errorCount + skippedCount) % 100 === 0) {
      logger.info({
        description: "Progress",
        matchedCount,
        updatedCount,
        errorCount,
        skippedCount,
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
    skippedCount,
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
