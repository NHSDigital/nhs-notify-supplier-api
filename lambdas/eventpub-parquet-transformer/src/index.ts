import { createDependenciesContainer } from "./deps";
import createHandler from "./handler";

// eslint-disable-next-line import-x/prefer-default-export
export const handler = createHandler(createDependenciesContainer());
