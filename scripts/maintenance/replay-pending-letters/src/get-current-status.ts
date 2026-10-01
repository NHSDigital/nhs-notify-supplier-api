import { readFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "eu-west-2" }),
);

async function loadIds(filePath: string): Promise<string[]> {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const fileContents = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(fileContents) as unknown;

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`No letter ids were found in ${filePath}`);
  }

  const ids = parsed.filter((value): value is string => typeof value === "string");
  if (ids.length === 0) {
    throw new Error(`No valid letter ids were found in ${filePath}`);
  }

  return ids;
}

async function main() {
  const { file, tableName, supplierId } = await yargs(hideBin(process.argv))
    .option("file", {
      alias: "f",
      type: "string",
      default: "./ccm-23888.json",
      describe: "Path to JSON array of Letter.id values",
    })
    .option("table-name", {
      type: "string",
      default: process.env.LETTERS_TABLE_NAME,
      describe: "DynamoDB letters table name",
    })
    .option("supplier-id", {
      type: "string",
      describe: "Optional supplierId for composite-key tables. For this repo, it is often xerox.",
    })
    .demandOption("table-name")
    .parse();

  const ids = await loadIds(file);

  for (const id of ids) {
    const key = supplierId ? { id, supplierId } : { id, supplierId: 'xerox' };
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
      }),
    );

    const item = result.Item as
      | {
          id?: string;
          supplierId?: string;
          status?: string;
          updatedAt?: string;
        }
      | undefined;

    console.log(JSON.stringify({
      id,
      supplierId: item?.supplierId ?? supplierId ?? "unknown",
      status: item?.status ?? "NOT_FOUND",
      updatedAt: item?.updatedAt ?? null,
    }));
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
