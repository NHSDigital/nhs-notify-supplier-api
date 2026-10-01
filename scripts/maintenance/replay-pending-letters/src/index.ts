import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import run from "./update-pending-letters";

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "$0",
      "Update the updatedAt of stale PENDING letters from a JSON file of ids",
      {
        file: {
          alias: "f",
          type: "string",
          demandOption: true,
        },
        dryrun: {
          type: "boolean",
          default: true,
        },
      },
      async (argv) => {
        await run(argv.file, argv.dryrun);
      },
    )
    .parse();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
