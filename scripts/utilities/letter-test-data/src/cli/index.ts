import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { LetterStatusType } from "@internal/datastore/src/types";
import { randomUUID } from "node:crypto";
import {
  createLetter,
  createLetterDto,
} from "../helpers/create_letter_helpers";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { uploadFile } from "../helpers/s3_helpers";

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
      },
      async (argv) => {
        const { supplierId } = argv;
        const letterId = argv.letterId ? argv.letterId : randomUUID();
        const bucketName = `nhs-${argv.awsAccountId}-eu-west-2-${argv.environment}-supapi-test-letters`;
        const targetFilename = `${letterId}.pdf`;
        const groupId = argv.groupId ? argv.groupId : randomUUID();
        const specificationId = argv.specificationId
          ? argv.specificationId
          : randomUUID();
        const { status } = argv;
        const { environment } = argv;
        const { ttlHours } = argv;
        const letterRepository = createLetterRepository(environment, ttlHours);

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
      },
      async (argv) => {
        // set batch ID
        const batchId = randomUUID();

        // parse args
        const { supplierId } = argv;
        const groupId = argv.groupId ? argv.groupId : randomUUID();
        const specificationId = argv.specificationId
          ? argv.specificationId
          : randomUUID();
        const { status } = argv;
        const { environment } = argv;
        const { ttlHours } = argv;
        const letterRepository = createLetterRepository(environment, ttlHours);
        const { count } = argv;

        // Upload a test file for this batch
        const bucketName = `nhs-${argv.awsAccountId}-eu-west-2-${argv.environment}-supapi-test-letters`;
        const targetFilename = `${batchId}-${status}.pdf`;
        const url = `s3://${bucketName}/${batchId}/${targetFilename}`;
        await uploadFile(
          bucketName,
          batchId,
          "../../test_letter.pdf",
          targetFilename,
        );

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
        await letterRepository.putLetterBatch(letterDtos);

        console.log(`Created batch ${batchId} of ${letterDtos.length}`);
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
