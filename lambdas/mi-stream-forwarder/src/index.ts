import createHandler from "./mi-stream-forwarder";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

const handler = createHandler(container);
export default handler;
