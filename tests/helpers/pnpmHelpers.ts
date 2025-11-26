import { spawn } from 'child_process';
import path from 'path';

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
  letterId: string;
  groupId: string;
  specificationId: string;
  status: string;
  count: number;
}) {
  const {
    filter,
    supplierId,
    environment,
    awsAccountId,
    letterId,
    groupId,
    specificationId,
    status,
    count,
  } = options;

    const workspaceRoot = path.resolve(__dirname, '../../scripts/test-data');
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const root = path.resolve(workspaceRoot);
    console.log('Workspace root:', root);

  // Build arguments array
  const args = [
    '-w', String(filter),
  //  '--filter', String(filter),
    'run',
    'cli',
    '--',
    'create-letter',
    '--supplier-id',
    supplierId,
    '--environment',
    environment,
    '--awsAccountId',
    awsAccountId,
    '--letter-id',
    letterId,
    '--group-id',
    groupId,
    '--specification-id',
    specificationId,
    '--status',
    status,
    '--count',
    String(count),
  ];
  console.log('🚀 Running:', [cmd, ...args].join(' '));

  await new Promise<void>((resolve, reject) => {
    let output = '';
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: root,
      shell: false,
    });
    child.stdout?.on('id', (id) => {
      const text = id.toString();
      output += text;
      process.stdout.write(text);
    });

    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`pnpm exited with ${code}`)));
    child.on('error', reject);
  });
}
