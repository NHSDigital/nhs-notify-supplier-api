import createAuthorizerHandler from "./authorizer";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

export const handler = createAuthorizerHandler(container);
