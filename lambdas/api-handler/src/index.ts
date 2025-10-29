import { createDependenciesContainer } from "./config/deps";
import { createGetLetterHandler } from "./handlers/get-letter";
import { createGetLetterDataHandler } from "./handlers/get-letter-data";
import { createGetLettersHandler } from "./handlers/get-letters";
import { createPatchLetterHandler } from "./handlers/patch-letter";
import { createPostMIHandler } from "./handlers/post-mi";
import { createGetStatusHandler } from "./handlers/get-status";

const container = createDependenciesContainer();

export const getLetter = createGetLetterHandler(container);
export const getLetterData = createGetLetterDataHandler(container);
export const getLetters = createGetLettersHandler(container);
export const patchLetter = createPatchLetterHandler(container);
export const postMI = createPostMIHandler(container);
export const getStatus = createGetStatusHandler(container);
