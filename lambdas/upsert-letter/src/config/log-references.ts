const LogRefs = {
  PROCESSING_RECORD: {
    code: "001-PROCESSING",
    description: "Processing record",
  },
  EXTRACTED_LETTER_EVENT: {
    code: "002-EXTRACTED-EVENT",
    description: "Extracted letter event",
  },
  INSERTED_LETTER: {
    code: "003-INSERTED",
    description: "Inserted letter",
  },
  LETTER_ALREADY_EXISTS: {
    code: "004-LETTER-EXISTS",
    description: "Letter already exists",
  },
  UPDATED_LETTER: {
    code: "005-UPDATED",
    description: "Updated letter",
  },
  ERROR_PROCESSING_UPSERT: {
    code: "006-ERROR",
    description: "Error processing upsert of record",
  },
  INDIVIDUAL_METRIC: {
    code: "007-METRIC",
    description: "Individual upsert letter metric",
  },
};

export default LogRefs;
