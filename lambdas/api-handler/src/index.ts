import { createDependenciesContainer } from "./config/deps";
import { createGetLetterHandler } from "./handlers/get-letter";
import { createGetLetterDataHandler } from "./handlers/get-letter-data";
import { createGetLettersHandler } from "./handlers/get-letters";
import { createPatchLetterHandler } from "./handlers/patch-letter";

const container = createDependenciesContainer();

export const getLetterHandler = createGetLetterHandler(container);
export const getLetterData = createGetLetterDataHandler(container);
export const getLetters = createGetLettersHandler(container);
export const patchLetter = createPatchLetterHandler(container);
