const LogRefs = {
  STARTING_SUPPLIER_MOCK: {
    code: "001-STARTING",
    description: "Starting supplier mock lambda",
  },
  PARSED_SUPPLIER_MOCK_CONFIG: {
    code: "002-CONFIG-PARSED",
    description: "Parsed supplier mock config from Parameter Store",
  },
  CALLING_GET_LETTERS: {
    code: "003-CALLING-GET-LETTERS",
    description: "about to call getLetters with limit",
  },
  FORWARDING_LETTERS_TO_PATCH: {
    code: "004-FORWARDING-LETTERS",
    description: "Forwarding letters to patch_letter lambda",
  },
  FAILED_TO_INVOKE_GET_LETTERS: {
    code: "005-GET-LETTERS-FAILED",
    description: "Failed to invoke get_letters lambda",
  },
  FAILED_TO_INVOKE_PATCH_LETTER: {
    code: "006-PATCH-LETTER-FAILED",
    description: "Failed to invoke patch_letter lambda",
  },
  PATCH_LETTER_FUNCTION_ERROR: {
    code: "007-PATCH-LETTER-ERROR",
    description: "patch_letter lambda returned a function error",
  },
  FAILED_TO_READ_CONFIG: {
    code: "008-CONFIG-READ-FAILED",
    description: "Failed to read supplier mock config from Parameter Store",
  },
  FINISHED_SUPPLIER_MOCK: {
    code: "009-FINISHED",
    description: "Finished supplier mock lambda",
  },
};

export default LogRefs;
