import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import {
  LetterStatusType,
} from "../../../../internal/datastore/src/types";
import { randomUUID } from "crypto";
import { createLetter } from "../helpers/create_letter_helpers";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "create-letter",
      "Create a letter",
      {
        "supplier-id": {
          type: "string",
          demandOption: true,
        },
        environment: {
          type: "string",
          demandOption: true,
        },
        awsAccountId: {
          type: "string",
          demandOption: true,
        },
        "letter-id": {
          type: "string",
          demandOption: false,
        },
        "group-id": {
          type: "string",
          demandOption: false,
        },
        "specification-id": {
          type: "string",
          demandOption: false,
        },
        status: {
          type: "string",
          demandOption: true,
          choices: [
            "PENDING",
            "ACCEPTED",
            "REJECTED",
            "PRINTED",
            "ENCLOSED",
            "CANCELLED",
            "DISPATCHED",
            "FAILED",
            "RETURNED",
            "DESTROYED",
            "FORWARDED",
            "DELIVERED",
          ],
        },
      },
      async (argv) => {
        const supplierId = argv.supplierId;
        const letterId = argv.letterId ? argv.letterId : randomUUID();
        const bucketName = `nhs-${argv.awsAccountId}-eu-west-2-${argv.environment}-supapi-test-letters`;
        const targetFilename = `${letterId}.pdf`;
        const groupId = argv.groupId ? argv.groupId : randomUUID();
        const specificationId = argv.specificationId
          ? argv.specificationId
          : randomUUID();
        const status = argv.status;
        const environment = argv.environment;
        const letterRepository = createLetterRepository(environment);

        createLetter({
          letterId,
          bucketName,
          supplierId,
          targetFilename,
          groupId,
          specificationId,
          status: status as LetterStatusType,
          letterRepository,
        });
      },
    )
    .demandCommand(1)
    .parse();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
