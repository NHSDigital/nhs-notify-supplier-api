import { createDependenciesContainer } from "./config/deps";
import createUpsertLetterHandler from "./handler/upsert-handler";

const container = createDependenciesContainer();

export const upsertLetterHandler = createUpsertLetterHandler(container);
export default upsertLetterHandler;
