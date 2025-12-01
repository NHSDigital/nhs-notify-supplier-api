import { createDependenciesContainer } from "./config/deps";
import createUpsertLetterHandler from "./handler/upsert-handler";

const container = createDependenciesContainer();

const upsertLetterHandler = createUpsertLetterHandler(container);
export default upsertLetterHandler;
