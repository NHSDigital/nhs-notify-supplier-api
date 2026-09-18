const LogRefs = {
  RECEIVED_EVENT: {
    code: "001-RECEIVED-EVENT",
    description: "Received event",
  },
  NUMBER_OF_RECORDS: {
    code: "002-RECORDS",
    description: "Number of records",
  },
  ERROR_PROCESSING_DDB_RECORD: {
    code: "003-DDB-ERROR",
    description: "Error processing ddbRecord",
  },
  PERSISTING_PENDING_LETTER: {
    code: "004-PERSISTING-LETTER",
    description: "Persisting pending letter",
  },
  LETTER_ALREADY_EXISTS: {
    code: "005-LETTER-EXISTS",
    description: "Letter already exists",
  },
  DELETING_PENDING_LETTER: {
    code: "006-DELETING-LETTER",
    description: "Deleting pending letter",
  },
  LETTER_DOES_NOT_EXIST: {
    code: "007-LETTER-NOT-EXIST",
    description: "Letter does not exist",
  },
  PROCESSING_COMPLETE: {
    code: "008-COMPLETE",
    description: "Processing complete",
  },
  QUEUE_DELTA_METRIC: {
    code: "009-METRIC",
    description: "Queue delta metric",
  },
  PROCESSING_KINESIS_RECORD: {
    code: "010-PROCESSING-RECORD",
    description: "Processing Kinesis record",
  },
  DECODED_PAYLOAD: {
    code: "011-DECODED",
    description: "Decoded payload",
  },
  EXTRACTED_DYNAMODB_RECORD: {
    code: "012-DYNAMODB-RECORD",
    description: "Extracted dynamoDBRecord",
  },
  ERROR_EXTRACTING_PAYLOAD: {
    code: "013-ERROR-EXTRACTING-PAYLOAD",
    description: "Error extracting payload",
  },
};

export default LogRefs;
