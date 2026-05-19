import { createDependenciesContainer } from "./deps";
import createHandler from "./supplier-mock";

const containerPromise = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const supplierMockHandler = async (
  ...args: Parameters<ReturnType<typeof createHandler>>
) => {
  return createHandler(await containerPromise)(...args);
};
