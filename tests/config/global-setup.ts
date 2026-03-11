import { logger } from "tests/helpers/pino-logger";
import { supplierDataSetup } from "tests/helpers/suppliers-setup-helper";
import { createTestData } from "../helpers/generate-fetch-test-data";
import { SUPPLIERID } from "../constants/api-constants";

async function globalSetup() {
  logger.info("");
  logger.info("*** BEGINNING GLOBAL SETUP ***");
  logger.info("");

  // create test data

  await createTestData(SUPPLIERID, 10);

  // check supplier exists
  await supplierDataSetup(SUPPLIERID);

  logger.info("");
  logger.info("*** GLOBAL SETUP COMPLETE ***");
  logger.info("");
}

export default globalSetup;
