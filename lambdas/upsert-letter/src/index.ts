import { createDependenciesContainer } from "./config/deps";
import createUpsertLetterHandler from "./handler/upsert-handler";

const container = createDependenciesContainer();

// eslint-disable-next-line import-x/prefer-default-export
export const upsertLetterHandler = createUpsertLetterHandler(container);
