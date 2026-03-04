import createHandler from "./update-letter-queue";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const handler = createHandler(container);
