import { createDependenciesContainer } from "./config/deps";
import { createGetLetterDataHandler } from "./handlers/get-letter-data";
import { createGetLettersHandler } from "./handlers/get-letters";
import { createPatchLetterHandler } from "./handlers/patch-letter";

const container = createDependenciesContainer();

export const getLetterData = createGetLetterDataHandler(container);
export const getLetters = createGetLettersHandler(container);
export const patchLetter = createPatchLetterHandler(container);
