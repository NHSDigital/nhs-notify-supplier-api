const LogRefs = {
  RECEIVED_EVENT: {
    code: "001-RECEIVED-EVENT",
    description: "Received event",
  },
  NUMBER_OF_RECORDS: {
    code: "002-NUMBER-OF-RECORDS",
    description: "Number of records",
  },
  FILTERING_RECORD: {
    code: "003-FILTERING-RECORD",
    description: "Filtering record",
  },
  PROCESSING_KINESIS_RECORD: {
    code: "004-PROCESSING-RECORD",
    description: "Processing Kinesis record",
  },
  DECODED_PAYLOAD: {
    code: "005-DECODED-PAYLOAD",
    description: "Decoded payload",
  },
  EXTRACTED_DYNAMODB_RECORD: {
    code: "006-EXTRACTED-DYNAMODB-RECORD",
    description: "Extracted dynamoDBRecord",
  },
  ERROR_EXTRACTING_PAYLOAD: {
    code: "007-ERROR-EXTRACTING-PAYLOAD",
    description: "Error extracting payload",
  },
  PUBLISHING_BATCH: {
    code: "008-PUBLISHING-BATCH",
    description: "Publishing batch",
  },
  METRIC: {
    code: "009-METRIC",
    description: "Metric",
  },
};

export default LogRefs;
