import createDependenciesContainer from "./handler/deps";
import createHandler from "./handler/populate-unallocated-breaches";

// eslint-disable-next-line import-x/prefer-default-export
export const populateUnallocatedBreachesHandler = createHandler(
  createDependenciesContainer(),
);
