import { createDependenciesContainer } from "./config/deps";
import createSupplierAllocatorHandler from "./handler/allocate-handler";

const container = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const supplierAllocatorHandler =
  createSupplierAllocatorHandler(container);
