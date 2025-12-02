import { createHandler } from "./mi-updates-transformer";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

const handler = createHandler(container);

export default handler;
