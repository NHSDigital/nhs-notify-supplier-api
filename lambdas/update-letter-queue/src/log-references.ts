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
  LETTER_ADDED_TO_QUEUE: {
    code: "004-LETTER-ADDED",
    description: "Letter added to queue",
  },
  LETTER_ALREADY_EXISTS: {
    code: "005-LETTER-EXISTS",
    description: "Letter already exists",
  },
  LETTER_REMOVED_FROM_QUEUE: {
    code: "006-LETTER-REMOVED",
    description: "Letter removed from queue",
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
  INVALID_LETTER_DROPPED: {
    code: "014-INVALID-LETTER-DROPPED",
    description: "Invalid letter data, record dropped",
  },
};

export default LogRefs;
