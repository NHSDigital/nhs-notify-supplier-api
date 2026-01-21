import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { LetterStatusType } from "@internal/datastore/src/types";
import { randomUUID } from "node:crypto";
import {
  createLetter,
  createLetterDto,
} from "../helpers/create-letter-helpers";
import createLetterRepository from "../infrastructure/letter-repo-factory";
import uploadFile from "../helpers/s3-helpers";

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
          choices: [
            "820178564574", // Supplier Dev
            "885964308133", // Supplier Nonprod
          ],
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
        "ttl-hours": {
          type: "number",
          demandOption: false,
          default: 336,
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
            "FORWARDED",
            "DELIVERED",
          ],
        },
        "test-letter": {
          type: "string",
          demandOption: true,
          choices: [
            "test-letter-large",
            "test-letter-standard",
            "none", // none exists to specify letter without pdf for error testing scenarios
          ],
        },
      },
      async (argv) => {
        const { supplierId } = argv;
        const letterId = argv.letterId ?? randomUUID();
        const bucketName = `nhs-${argv.awsAccountId}-eu-west-2-${argv.environment}-supapi-test-letters`;
        const targetFilename = `${letterId}.pdf`;
        const groupId = argv.groupId ?? randomUUID();
        const specificationId = argv.specificationId ?? randomUUID();
        const { status } = argv;
        const { environment } = argv;
        const { ttlHours } = argv;
        const letterRepository = createLetterRepository(environment, ttlHours);
        const { testLetter } = argv;

        createLetter({
          letterId,
          bucketName,
          supplierId,
          targetFilename,
          groupId,
          specificationId,
          status: status as LetterStatusType,
          letterRepository,
          testLetter,
        });
      },
    )
    .command(
      "create-letter-batch",
      "Create a batch of letters",
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
          choices: [
            "820178564574", // Supplier Dev
            "885964308133", // Supplier Nonprod
          ],
        },
        "group-id": {
          type: "string",
          demandOption: false,
        },
        "specification-id": {
          type: "string",
          demandOption: false,
        },
        "ttl-hours": {
          type: "number",
          demandOption: false,
          default: 336,
        },
        count: {
          type: "number",
          demandOption: true,
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
            "FORWARDED",
            "DELIVERED",
          ],
        },
        "test-letter": {
          type: "string",
          demandOption: true,
          choices: [
            "test-letter-large",
            "test-letter-standard",
            "none", // none exists to specify letter without pdf for error testing scenarios
          ],
        },
      },
      async (argv) => {
        // set batch ID
        const batchId = randomUUID();

        // parse args
        const { supplierId } = argv;
        const groupId = argv.groupId ?? randomUUID();
        const specificationId = argv.specificationId ?? randomUUID();
        const { status } = argv;
        const { environment } = argv;
        const { ttlHours } = argv;
        const letterRepository = createLetterRepository(environment, ttlHours);
        const { count } = argv;
        const { testLetter } = argv;

        // Setup file attributes
        const bucketName = `nhs-${argv.awsAccountId}-eu-west-2-${argv.environment}-supapi-test-letters`;
        const targetFilename = `${batchId}-${status}.pdf`;
        const folder = `${supplierId}/${batchId}`;
        const url = `s3://${bucketName}/${folder}/${targetFilename}`;

        // Upload a test file for this batch if it is not an 'none' batch
        if (testLetter !== "none") {
          await uploadFile(
            bucketName,
            folder,
            `${testLetter}.pdf`,
            targetFilename,
          );
        }

        // Create letter DTOs
        const letterDtos = [];
        for (let i = 0; i < count; i++) {
          letterDtos.push(
            createLetterDto({
              letterId: randomUUID(),
              supplierId,
              groupId,
              specificationId,
              status: status as LetterStatusType,
              url,
            }),
          );
        }

        // Upload Letters
        await letterRepository.unsafePutLetterBatch(letterDtos);

        console.log(`Created batch ${batchId} of ${letterDtos.length} letters`);
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
