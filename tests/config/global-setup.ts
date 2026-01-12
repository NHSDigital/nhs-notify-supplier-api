import {
  checkSupplierExists,
  createSupplierEntry,
  createTestData,
} from "../helpers/generate-fetch-test-data";
import { SUPPLIERID } from "../constants/api-constants";

async function globalSetup() {
  console.log("");
  console.log("*** BEGINNING GLOBAL SETUP ***");
  console.log("");

  // create test data

  await createTestData(SUPPLIERID, 10);

  // check supplier exists
  const supplier = await checkSupplierExists(SUPPLIERID);
  if (supplier) {
    console.log(`Supplier with ID ${SUPPLIERID} already exists.`);
    console.log("");
    console.log("*** GLOBAL SETUP COMPLETE ***");
    console.log("");
    return;
  }

  console.log(`Creating supplier entry with ID: ${SUPPLIERID}`);
  await createSupplierEntry(SUPPLIERID);

  console.log("");
  console.log("*** GLOBAL SETUP COMPLETE ***");
  console.log("");
}

export default globalSetup;
