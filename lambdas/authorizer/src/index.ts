import createAuthorizerHandler from "./authorizer";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

const handler = createAuthorizerHandler(container);

export { handler };
