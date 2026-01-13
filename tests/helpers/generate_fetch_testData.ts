import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  LETTERSTABLENAME,
  SUPPLIERID,
  envName,
} from "../constants/api_constants";
import { runCreateLetter } from "./pnpmHelpers";

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

export interface SupplierApiLetters {
  supplierId: string;
  specificationId: string;
  supplierStatus: string;
  createdAt: string;
  supplierStatusSk: string;
  updatedAt: string;
  groupId: string;
  reasonCode: string;
  id: string;
  url: string;
  ttl: string;
  reasonText: string;
  status: string;
  source: string;
}

export async function createTestData(supplierId: string): Promise<void> {
  await runCreateLetter({
    filter: "nhs-notify-supplier-api-data-generator",
    supplierId,
    environment: envName,
    awsAccountId: "820178564574",
    groupId: "TestGroupID",
    specificationId: "TestSpecificationID",
    status: "PENDING",
    count: 1,
  });
}

export const getLettersBySupplier = async (
  supplierId: string,
  status: string,
  limit: number,
) => {
  const supplierStatus = `${supplierId}#${status}`;
  const params = {
    TableName: LETTERSTABLENAME,
    IndexName: "supplierStatus-index",
    KeyConditionExpression: "supplierStatus = :supplierStatus",
    ProjectionExpression:
      "id, specificationId, groupId, reasonCode, reasonText",
    ExpressionAttributeValues: {
      ":supplierStatus": supplierStatus,
    },
    Limit: limit,
  };

  const { Items } = await docClient.send(new QueryCommand(params));
  if (!Items || Items.length === 0) {
    throw new Error(`Unexpectedly found no data found for ${supplierId}.`);
  }
  return Items as SupplierApiLetters[];
};

export const deleteLettersBySupplier = async (id: string) => {
  const resp = await docClient.send(
    new DeleteCommand({
      TableName: LETTERSTABLENAME,
      Key: { supplierId: SUPPLIERID, id },
      ReturnValues: "ALL_OLD",
    }),
  );
  return resp.Attributes;
};
