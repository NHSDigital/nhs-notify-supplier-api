import { createDependenciesContainer } from "./config/deps";
import createSupplierConfigIngressHandler from "./handler/supplier-config-ingress-handler";

const container = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const supplierConfigHandler =
  createSupplierConfigIngressHandler(container);
