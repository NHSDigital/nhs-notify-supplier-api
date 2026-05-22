import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import fs from "node:fs";
import path from "node:path";
import { createLetterDocClient } from "../infrastructure/letters-repo-factory";

const commandOptions = {
  environment: { type: "string" as const, demandOption: true },
  supplierId: { type: "string" as const, demandOption: true },
  status: { type: "string" as const, demandOption: true },
};

/* eslint-disable import-x/prefer-default-export */
export async function updateFailedLetters(
  environment: string,
  supplierId: string,
  status: string,
) {
  const { config, docClient, log } = createLetterDocClient(environment);
  const compoundKey = `${supplierId}#${status}`;
  let lastKey: Record<string, any> | undefined;
  let updatedCount = 0;
  let failedCount = 0;
  const logFile = path.resolve(
    process.cwd(),
    `updated-letters-${Date.now()}.log`,
  );
  const failuresFile = path.resolve(
    process.cwd(),
    `failed-letters-${Date.now()}.log`,
  );

  do {
    const queryCmd = new QueryCommand({
      TableName: config.lettersTableName,
      IndexName: config.supplierStatusIndex,
      KeyConditionExpression: "supplierStatus = :ss",
      FilterExpression: "attribute_exists(groupId) AND size(groupId) > :len",
      ExpressionAttributeValues: { ":ss": compoundKey, ":len": 100 },
      ExclusiveStartKey: lastKey,
    });

    const result = await docClient.send(queryCmd);

    for (const item of result.Items || []) {
      try {
        log.info(
          `Updating letter ${item.letterId} (groupId length: ${item.groupId?.length}) to FAILED`,
        );
        const updateCmd = new UpdateCommand({
          TableName: config.lettersTableName,
          Key: { letterId: item.letterId },
          UpdateExpression: "SET #status = :failed",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":failed": "FAILED" },
        });
        await docClient.send(updateCmd);
        fs.appendFileSync(logFile, `${item.letterId}\n`, "utf8");
        updatedCount += 1;
      } catch (error) {
        log.error({ err: error }, `Failed to update letter ${item.letterId}`);
        fs.appendFileSync(failuresFile, `${item.letterId}\n`, "utf8");
        failedCount += 1;
      }
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  log.info(
    `Updated ${updatedCount} letters to FAILED. IDs written to ${logFile}`,
  );
  log.info(`${failedCount} failed updates written to ${failuresFile}`);
}

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "fix-status",
      "Update letters with long groupId to FAILED",
      commandOptions,
      async (argv) => {
        const environment = argv.environment as string;
        const supplierId = argv.supplierId as string;
        const status = argv.status as string;
        await updateFailedLetters(environment, supplierId, status);
      },
    )
    .demandCommand(1)
    .parse();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
