import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getLetterById,
  updateLetterUpdatedAt,
} from "./infra/letter-repository";

type Summary = {
  found: number;
  updated: number;
  dryRun: number;
  skippedStatus: number;
  skippedTtl: number;
  missing: number;
  failed: number;
};

const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;

async function loadIds(filePath: string): Promise<string[]> {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const fileContents = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(fileContents) as string[];
  const ids = [...new Set(parsed)];

  if (ids.length === 0) {
    throw new Error("No database ids were found in the input file.");
  }

  return ids;
}

function getTableName(): string {
  const tableName = process.env.LETTERS_TABLE_NAME;

  if (!tableName) {
    throw new Error(
      "LETTERS_TABLE_NAME must be set before running this script.",
    );
  }

  return tableName;
}

export default async function run(
  file: string,
  dryrun: boolean,
): Promise<void> {
  const tableName = getTableName();
  const ids = await loadIds(file);

  const now = new Date();
  const currentUpdatedAt = now.toISOString();
  const staleUpdatedAtThreshold = new Date(
    now.getTime() - WEEK_IN_SECONDS * 1000,
  ).toISOString();

  const summary: Summary = {
    found: 0,
    updated: 0,
    dryRun: 0,
    skippedStatus: 0,
    skippedTtl: 0,
    missing: 0,
    failed: 0,
  };

  console.log(
    `Starting replay-pending-letter for ${ids.length} ids on ${tableName} (${dryrun ? "dry run" : "write mode"})`,
  );

  console.log(`processing 0/${ids.length}`);

  for (const [index, id] of ids.entries()) {
    try {
      console.log(`processing ${index + 1}/${ids.length}`);

      const stats = summary;
      const letter = await getLetterById(tableName, id);

      if (!letter) {
        stats.missing += 1;
        console.log(`  ${id}: not found`);
        continue;
      }

      stats.found += 1;

      if (letter.status !== "PENDING") {
        stats.skippedStatus += 1;
        console.log(`  ${id}: skipped, status=${letter.status}`);
        continue;
      }

      if (letter.updatedAt >= staleUpdatedAtThreshold) {
        stats.skippedTtl += 1;
        console.log(`  ${id}: skipped, updatedAt is newer than one week`);
        continue;
      }

      if (dryrun) {
        stats.dryRun += 1;
        console.log(`  ${id}: dry run, would update updatedAt`);
        continue;
      }

      await updateLetterUpdatedAt(tableName, {
        id,
        updatedAt: currentUpdatedAt,
      });

      stats.updated += 1;
      console.log(`  ${id}: updated`);

    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ${id}: failed, ${message}`);
    }
  }

  console.log(
    `Completed: found=${summary.found}, updated=${summary.updated}, dryRun=${summary.dryRun}, skippedStatus=${summary.skippedStatus}, skippedRecent=${summary.skippedTtl}, missing=${summary.missing}, failed=${summary.failed}`,
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}
