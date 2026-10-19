const LogRefs = {
  EXTRACT_EVENT: {
    code: "001-EXTRACT",
    description: "Extracted letter event",
  },
  FILTERING_ALLOCATIONS: {
    code: "002-FILTER",
    description: "Filtering allocations for letter variant supplier",
  },
  FILTERED_PACK_SPECIFICATION: {
    code: "003-FILTER-PACK",
    description:
      "Pack specification filtered out based on pageCount constraints",
  },
  SUPPLIER_CAPACITY_EXCEEDED: {
    code: "004-CAPACITY",
    description: "Supplier has exceeded daily capacity",
  },
  CALCULATED_SUPPLIER_FACTORS: {
    code: "005-FACTOR",
    description: "Calculated supplier factors for allocation",
  },
  FETCHED_SUPPLIER_DETAILS: {
    code: "006-FETCH",
    description: "Fetched supplier details for supplier allocations",
  },
  RESOLVED_SUPPLIER: {
    code: "007-RESOLVED",
    description: "Resolved supplier details from config",
  },
  DATA_METRIC: {
    code: "008-DATA-METRIC",
    description: "Emitted supplier allocation data metric",
  },
  UPDATED_ALLOCATIONS: {
    code: "009-UPDATED",
    description: "Updated allocations for volume group and supplier",
  },
  SENDING_UPSERT_MESSAGE: {
    code: "010-UPSERT",
    description: "Sending message to upsert letter queue",
  },
  ALLOCATION_METRIC: {
    code: "011-METRIC",
    description: "Emitted supplier allocation metric",
  },
  SENDING_DLQ_MESSAGE: {
    code: "012-DLQ",
    description: "Sending record to supplier allocator DLQ",
  },
  NO_ALLOCATIONS_FOR_VARIANT_SUPPLIER: {
    code: "013-NO-ALLOCATIONS",
    description: "No allocations found for specified letter variant supplier",
  },
  ALLOCATIONS_DO_NOT_SUM_TO_100: {
    code: "014-SUM-NOT-100",
    description: "Supplier allocations do not sum to 100%",
  },
  SUPPLIER_DETAILS_MISMATCH: {
    code: "015-MISMATCH",
    description: "Mismatch between supplier allocations and supplier details",
  },
  LETTER_REQUEST_REJECTED: {
    code: "016-REJECTED",
    description: "Letter request rejected",
  },
  ERROR_PROCESSING_ALLOCATION: {
    code: "017-PROCESSING-ERROR",
    description: "Error processing allocation of record",
  },
  FAILED_TO_SEND_DLQ: {
    code: "018-DLQ-FAILED",
    description: "Failed to send record to supplier allocator DLQ",
  },
  ZERO_SUPPLIER_ALLOCATION: {
    code: "019-ZERO-ALLOCATION",
    description: "Supplier allocation has zero percentage",
  },
  INACTIVE_VOLUME_GROUP: {
    code: "020-INACTIVE-VOLUME-GROUP",
    description: "Volume group is not active based on status and dates",
  },
  NO_SUPPLIER_ALLOCATIONS: {
    code: "021-NO-ALLOCATIONS",
    description:
      "No supplier allocations found for variantsupplier id in volume group",
  },
  NO_SUPPLIER_DETAILS: {
    code: "022-NO-DETAILS",
    description: "No supplier details found for supplier allocations",
  },
  NO_ACTIVE_SUPPLIERS: {
    code: "023-NO-ACTIVE-SUPPLIERS",
    description: "No active suppliers found for supplier allocations",
  },
  NO_PREFERRED_SUPPLIER_PACKS: {
    code: "024-NO-PREFERRED-PACKS",
    description:
      "No preferred supplier packs found for pack specification ids and suppliers",
  },
  INACTIVE_PACK_SPECIFICATION: {
    code: "025-INACTIVE-PACK",
    description: "Pack specification is not active based on status",
  },
  NO_ELIGIBLE_PACK_SPECIFICATIONS: {
    code: "026-NO-ELIGIBLE-PACKS",
    description: "No eligible pack specifications found for letter",
  },
};

export default LogRefs;
