import { createHandler } from "./mi-updates-transformer";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

export const handler = createHandler(container);
