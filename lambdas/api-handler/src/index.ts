import { createDependenciesContainer } from "./config/deps";
import { createGetLetterHandler } from "./handlers/get-letter";
import { createGetLetterDataHandler } from "./handlers/get-letter-data";
import { createGetLettersHandler } from "./handlers/get-letters";
import { createPatchLetterHandler } from "./handlers/patch-letter";
import { createPostLettersReceiverHandler } from "./handlers/post-letters-receiver";
import { createLetterStatusUpdateHandler } from "./handlers/letter-status-update";
import { createPostMIHandler } from "./handlers/post-mi";

const container = createDependenciesContainer();

export const getLetter = createGetLetterHandler(container);
export const getLetterData = createGetLetterDataHandler(container);
export const getLetters = createGetLettersHandler(container);
export const patchLetter = createPatchLetterHandler(container);
export const letterStatusUpdate = createLetterStatusUpdateHandler(container);
export const postLettersReceiver = createPostLettersReceiverHandler(container);

export const postMI = createPostMIHandler(container);
