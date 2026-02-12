import { createDependenciesContainer } from "./config/deps";
import createAllocateLetterHandler from "./handler/allocate-handler";

const container = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const allocateLetterHandler = createAllocateLetterHandler(container);
