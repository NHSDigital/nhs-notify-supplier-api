import createDependenciesContainer from "./handler/deps";
import createHandler from "./handler/populate-supplier-config-cache";

// eslint-disable-next-line import-x/prefer-default-export
export const populateSupplierConfigCacheHandler = createHandler(
  createDependenciesContainer(),
);
