import { logger } from "tests/helpers/pino-logger";
import {
  checkSupplierExists,
  createSupplierEntry,
} from "./generate-fetch-test-data";

export async function supplierDataSetup(supplierId: string) {
  const supplier = await checkSupplierExists(supplierId);
  if (supplier) {
    logger.info(`Supplier with ID ${supplierId} already exists.`);
    return;
  }

  logger.info(`Creating supplier entry with ID: ${supplierId}`);
  await createSupplierEntry(supplierId);
}
