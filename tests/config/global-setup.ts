import { logger } from "tests/helpers/pino-logger";
import { supplierDataSetup } from "tests/helpers/suppliers-setup-helper";
import { SUPPLIERID } from "../constants/api-constants";

async function globalSetup() {
  logger.info("");
  logger.info("*** BEGINNING GLOBAL SETUP ***");
  logger.info("");

  // check supplier exists
  await supplierDataSetup(SUPPLIERID);

  logger.info("");
  logger.info("*** GLOBAL SETUP COMPLETE ***");
  logger.info("");
}

export default globalSetup;
