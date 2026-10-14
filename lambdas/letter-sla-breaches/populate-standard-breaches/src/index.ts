import { createDependenciesContainer } from "@internal/letter-sla-breaches-common";
import createHandler from "./handler/populate-standard-breaches";

// eslint-disable-next-line import-x/prefer-default-export
export const populateStandardBreachesHandler = createHandler(
  createDependenciesContainer(),
);
