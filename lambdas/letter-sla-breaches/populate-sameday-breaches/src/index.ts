import { createDependenciesContainer } from "@internal/letter-sla-breaches-common";
import createHandler from "./handler/populate-sameday-breaches";

// eslint-disable-next-line import-x/prefer-default-export
export const populateSamedayBreachesHandler = createHandler(
  createDependenciesContainer(),
);
