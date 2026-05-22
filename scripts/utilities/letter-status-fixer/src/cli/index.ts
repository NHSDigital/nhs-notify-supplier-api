import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { QueryCommand, QueryCommandOutput, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createLetterDocClient } from "../infrastructure/letters-repo-factory";

async function updateFailedLetters(environment: string, supplierId: string, status: string) {
  const { docClient, log, config } = createLetterDocClient(environment);
  const compoundKey = `${supplierId}#${status}`;

  let lastKey: Record<string, any> | undefined = undefined;
  let updatedCount = 0;

  do {
    const queryCmd = new QueryCommand({
      TableName: config.lettersTableName,
      IndexName: config.supplierStatusIndex,
      KeyConditionExpression: "supplierStatus = :ss",
      ExpressionAttributeValues: { ":ss": compoundKey },
      ExclusiveStartKey: lastKey,
    });
    const result = await docClient.send(queryCmd) as QueryCommandOutput;
    for (const item of result.Items || []) {
      if (item.groupId && item.groupId.length > 100) {
        log.info(`Updating letter ${item.letterId} (groupId length: ${item.groupId.length}) to FAILED`);
        const updateCmd = new UpdateCommand({
          TableName: config.lettersTableName,
          Key: { letterId: item.letterId },
          UpdateExpression: "SET #status = :failed",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":failed": "FAILED" },
        });
        await docClient.send(updateCmd);
        updatedCount++;
      }
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  log.info(`Updated ${updatedCount} letters to FAILED.`);
}

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "fix-status",
      "Update letters with long groupId to FAILED",
      {
        environment: { type: "string", demandOption: true },
        supplierId: { type: "string", demandOption: true },
        status: { type: "string", demandOption: true },
      },
      async (argv) => {
        await updateFailedLetters(argv.environment, argv.supplierId, argv.status);
      }
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
