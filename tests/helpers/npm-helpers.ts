import { spawn } from "node:child_process";
import path from "node:path";

/**
 * Runs the "create-letter" CLI command via npm.
 *
 * @param options Command-line options for the script.
 */
export async function runCreateLetter(options: {
  filter?: string;
  supplierId: string;
  environment: string;
  awsAccountId: string;
  groupId: string;
  specificationId: string;
  status: string;
  count: number;
  testLetter: string;
}): Promise<string[]> {
  const {
    awsAccountId,
    count,
    environment,
    filter,
    groupId,
    specificationId,
    status,
    supplierId,
    testLetter,
  } = options;

  const workspaceRoot = path.resolve(
    __dirname,
    "../../scripts/utilities/letter-test-data",
  );
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const root = path.resolve(workspaceRoot);

  // Build arguments array
  const args = [
    "-w",
    String(filter),
    //  '--filter', String(filter),
    "run",
    "cli",
    "--",
    "create-letter-batch",
    "--supplier-id",
    supplierId,
    "--environment",
    environment,
    "--awsAccountId",
    awsAccountId,
    "--group-id",
    groupId,
    "--specification-id",
    specificationId,
    "--status",
    status,
    "--count",
    String(count),
    "--test-letter",
    testLetter,
  ];

  return new Promise<string[]>((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ["inherit", "pipe", "inherit"],
      cwd: root,
      shell: false,
    });
    let output = "";
    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`npm exited with ${code}`));
        return;
      }

      const letterIdsMatch = /LETTER_IDS:(\[[^\n]*\])/.exec(output);
      if (!letterIdsMatch) {
        reject(new Error("LETTER_IDS not found in output"));
        return;
      }

      try {
        const letterIds = JSON.parse(letterIdsMatch[1]) as string[];
        resolve(letterIds);
      } catch (error) {
        reject(new Error(`Failed to parse LETTER_IDS JSON: ${String(error)}`));
      }
    });
    child.on("error", reject);
  });
}

export async function createSupplierData(options: {
  filter?: string;
  supplierId: string;
  name: string;
  apimId: string;
  environment: string;
  status: string;
}) {
  const { apimId, environment, filter, name, status, supplierId } = options;

  const workspaceRoot = path.resolve(
    __dirname,
    "../../scripts/utilities/supplier-data",
  );
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const root = path.resolve(workspaceRoot);

  // Build arguments array
  const args = [
    "-w",
    String(filter),
    //  '--filter', String(filter),
    "run",
    "cli",
    "--",
    "put-supplier",
    "--id",
    supplierId,
    "--name",
    name,
    "--apimId",
    apimId,
    "--status",
    status,
    "--environment",
    environment,
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      cwd: root,
      shell: false,
    });
    child.stdout?.on("id", (id) => {
      const text = id.toString();
      process.stdout.write(text);
    });

    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`npm exited with ${code}`)),
    );
    child.on("error", reject);
  });
}
