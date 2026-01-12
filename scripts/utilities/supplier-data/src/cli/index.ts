import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { LetterStatusType } from "@internal/datastore/src/types";
import { randomUUID } from "node:crypto";
import { createSupplierRepository } from "../infrastructure/suppliers-repo-factory";

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "put-supplier",
      "Create or update a supplier",
      {
        environment: {
          type: "string",
          demandOption: true,
        },
        id: {
          type: "string",
          demandOption: true,
        },
        name: {
          type: "string",
          demandOption: true,
        },
        apimId: {
          type: "string",
          demandOption: true,
        },
        status: {
          type: "string",
          demandOption: true,
          choices: ["ENABLED", "DISABLED"],
        },
      },
      async (argv) => {
        // parse args
        const { id } = argv;
        const { name } = argv;
        const { apimId } = argv;
        const status = argv.status as "ENABLED" | "DISABLED";

        const { environment } = argv;

        const supplierRepository = createSupplierRepository(environment);

        const putResult = await supplierRepository.putSupplier({
          id,
          name,
          apimId,
          status,
        });

        console.log(`PUT successful ${JSON.stringify(putResult)}`);
      },
    )
    .command(
      "get-supplier-by-id",
      "Get a supplier by their Supplier ID",
      {
        id: {
          type: "string",
          demandOption: true,
        },
        environment: {
          type: "string",
          demandOption: true,
        },
      },
      async (argv) => {
        const { id } = argv;
        const { environment } = argv;

        const supplierRepository = createSupplierRepository(environment);

        const getResult = await supplierRepository.getSupplierById(id);

        console.log(`GET successful: ${JSON.stringify(getResult)}`);
      },
    )
    .command(
      "get-supplier-by-apim-id",
      "Get a supplier by their APIM ID",
      {
        apimId: {
          type: "string",
          demandOption: true,
        },
        environment: {
          type: "string",
          demandOption: true,
        },
      },
      async (argv) => {
        const { apimId } = argv;
        const { environment } = argv;

        const supplierRepository = createSupplierRepository(environment);

        const getResult = await supplierRepository.getSupplierByApimId(apimId);

        console.log(`GET successful: ${JSON.stringify(getResult)}`);
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
