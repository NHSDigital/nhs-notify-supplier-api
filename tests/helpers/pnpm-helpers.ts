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
}) {
  const {
    awsAccountId,
    count,
    environment,
    filter,
    groupId,
    specificationId,
    status,
    supplierId,
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
  ];

  await new Promise<void>((resolve, reject) => {
    let output = "";
    const child = spawn(cmd, args, {
      stdio: "inherit",
      cwd: root,
      shell: false,
    });
    child.stdout?.on("id", (id) => {
      const text = id.toString();
      output += text;
      process.stdout.write(output);
    });

    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`pnpm exited with ${code}`)),
    );
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
    let output = "";
    const child = spawn(cmd, args, {
      stdio: "inherit",
      cwd: root,
      shell: false,
    });
    child.stdout?.on("id", (id) => {
      const text = id.toString();
      output += text;
      process.stdout.write(output);
    });

    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`pnpm exited with ${code}`)),
    );
    child.on("error", reject);
  });
}
