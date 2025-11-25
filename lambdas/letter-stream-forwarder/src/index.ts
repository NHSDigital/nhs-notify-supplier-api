import { createHandler } from "./letter-stream-forwarder";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

export const handler = createHandler(container);
