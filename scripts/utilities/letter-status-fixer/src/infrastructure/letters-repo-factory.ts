import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import pino from "pino";

/* eslint-disable import-x/prefer-default-export */
export function createLetterDocClient(environment: string) {
  const ddbClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const log = pino();
  const config = {
    lettersTableName:
      process.env.LETTERS_TABLE || `nhs-${environment}-supapi-letters`,
    supplierStatusIndex:
      process.env.SUPPLIER_STATUS_INDEX || "supplierStatus-index",
  };
  return { docClient, log, config };
}
