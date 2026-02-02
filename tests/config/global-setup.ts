import { logger } from "tests/helpers/pino-logger";
import {
  checkSupplierExists,
  createSupplierEntry,
  createTestData,
} from "../helpers/generate-fetch-test-data";
import { SUPPLIERID } from "../constants/api-constants";

async function globalSetup() {
  logger.info("");
  logger.info("*** BEGINNING GLOBAL SETUP ***");
  logger.info("");

  // create test data

  await createTestData(SUPPLIERID, 10);

  // check supplier exists
  const supplier = await checkSupplierExists(SUPPLIERID);
  if (supplier) {
    logger.info(`Supplier with ID ${SUPPLIERID} already exists.`);
    logger.info("");
    logger.info("*** GLOBAL SETUP COMPLETE ***");
    logger.info("");
    return;
  }

  logger.info(`Creating supplier entry with ID: ${SUPPLIERID}`);
  await createSupplierEntry(SUPPLIERID);

  logger.info("");
  logger.info("*** GLOBAL SETUP COMPLETE ***");
  logger.info("");
}

export default globalSetup;
