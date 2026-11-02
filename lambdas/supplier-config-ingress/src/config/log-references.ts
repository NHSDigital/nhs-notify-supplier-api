const LogRefs = {
  PROCESSING_RECORD: {
    code: "001-PROCESSING-RECORD",
    description: "Processing record",
  },
  PROCESSING_SUPPLIER_CONFIG_UPSERT: {
    code: "002-PROCESSING-CONFIG",
    description: "Processing supplier config upsert",
  },
  SUPPLIER_CONFIG_UPSERTED: {
    code: "003-CONFIG-UPSERTED",
    description: "Supplier config upserted",
  },
  FAILED_TO_PROCESS_SUPPLIER_CONFIG_RECORD: {
    code: "004-PROCESSING-FAILED",
    description: "Failed to process supplier config record",
  },
  SUCCESS_METRIC: {
    code: "005-SUCCESS-METRIC",
    description: "Supplier config ingress success metric",
  },
  FAILURE_METRIC: {
    code: "006-FAILURE-METRIC",
    description: "Supplier config ingress failure metric",
  },
};

export default LogRefs;
