import { createDependenciesContainer } from "./deps";
import createHandler from "./supplier-mock";

const container = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const handler = createHandler(container);
