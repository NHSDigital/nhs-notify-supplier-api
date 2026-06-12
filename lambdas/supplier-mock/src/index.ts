import { createDependenciesContainer } from "./handler/deps";
import createHandler from "./handler/supplier-mock";

const containerPromise = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const supplierMockHandler = createHandler(containerPromise);
