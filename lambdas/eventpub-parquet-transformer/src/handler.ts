import { FirehoseTransformationHandler } from "aws-lambda";
import { Deps } from "./deps";
import LogRefs from "./log-references";
import transformRecord from "./transform-record";

export default function createHandler(
  deps: Deps,
): FirehoseTransformationHandler {
  return async (event) => {
    const records = event.records.map((record) => transformRecord(record));

    const failedRecordIds = records
      .filter((record) => record.result === "ProcessingFailed")
      .map((record) => record.recordId);

    for (const recordId of failedRecordIds) {
      deps.logger.warn({
        logRef: LogRefs.RECORD_PROCESSING_FAILED.code,
        description: LogRefs.RECORD_PROCESSING_FAILED.description,
        recordId,
      });
    }

    deps.logger.info({
      logRef: LogRefs.BATCH_COMPLETE.code,
      description: LogRefs.BATCH_COMPLETE.description,
      recordCount: records.length,
      failedCount: failedRecordIds.length,
    });

    return { records };
  };
}
