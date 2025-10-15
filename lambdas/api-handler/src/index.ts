import { createDependenciesContainer } from "./config/deps";
import { createGetLetterDataHandler } from "./handlers/get-letter-data";
import { createGetLettersHandler } from "./handlers/get-letters";
import { createPatchLetterHandler } from "./handlers/patch-letter";
import { createPostMIHandler } from "./handlers/post-mi";

const container = createDependenciesContainer();

export const getLetterData = createGetLetterDataHandler(container);
export const getLetters = createGetLettersHandler(container);
export const patchLetter = createPatchLetterHandler(container);
export const postMI = createPostMIHandler(container);
