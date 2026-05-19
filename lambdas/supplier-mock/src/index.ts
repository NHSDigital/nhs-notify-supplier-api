import { createDependenciesContainer } from "./deps";
import createHandler from "./supplier-mock";

const containerPromise = createDependenciesContainer();

export default async function handler(
  ...args: Parameters<ReturnType<typeof createHandler>>
) {
  return createHandler(await containerPromise)(...args);
}
