import { FirehoseTransformationHandler } from "aws-lambda";
import transformRecord from "./transform-record";

// eslint-disable-next-line import-x/prefer-default-export
export const handler: FirehoseTransformationHandler = async (event) => ({
  records: event.records.map((record) => transformRecord(record)),
});
