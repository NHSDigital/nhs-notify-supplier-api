#!/usr/bin/env tsx

// Script: update-failed-letters.ts
// Usage: tsx scripts/update-failed-letters.ts <supplierId> <status>
// Description: Looks up letters for a given supplierId and status, and updates letter statuses to FAILED where groupId is longer than 100 characters.

import { LetterRepository } from "@internal/datastore/src/letter-repository";
import { getDbContext } from "@internal/datastore/src/db-context";
import pino from "pino";

const logger = pino({ level: "info" });

async function main() {
  const [supplierId, status] = process.argv.slice(2);
  if (!supplierId || !status) {
    logger.error("Usage: tsx scripts/update-failed-letters.ts <supplierId> <status>");
    process.exit(1);
  }

  const db = await getDbContext();
  const letterRepo = new LetterRepository(db, logger);

  logger.info(`Looking up letters for supplierId=${supplierId}, status=${status}`);
  const letters = await letterRepo.getLettersBySupplierAndStatus(supplierId, status);

  let updatedCount = 0;
  for (const letter of letters) {
    if (letter.groupId && letter.groupId.length > 100) {
      logger.info(`Updating letter ${letter.id} (groupId length: ${letter.groupId.length}) to FAILED`);
      await letterRepo.updateLetterStatus(letter.id, "FAILED");
      updatedCount++;
    }
  }

  logger.info(`Updated ${updatedCount} letters to FAILED.`);
}

main().catch((err) => {
  logger.error({ err }, "Script failed");
  process.exit(1);
});
