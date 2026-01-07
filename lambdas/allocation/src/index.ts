import createAllocator from "./allocator";
import { createDependenciesContainer } from "./deps";

const container = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const handler = createAllocator(container);
