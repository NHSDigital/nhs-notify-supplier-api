import type { SQSBatchResponse, SQSEvent } from "aws-lambda";

// eslint-disable-next-line import-x/prefer-default-export
export const supplierConfigHandler = async (
  _event: SQSEvent,
): Promise<SQSBatchResponse> => {
  // Implementation to be done under CCM-17379
  return { batchItemFailures: [] };
};
