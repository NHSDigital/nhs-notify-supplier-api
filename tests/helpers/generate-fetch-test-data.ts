import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  LETTERSTABLENAME,
  SUPPLIERID,
  SUPPLIERTABLENAME,
  envName,
} from "../constants/api-constants";
import { createSupplierData, runCreateLetter } from "./pnpm-helpers";

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

export async function createTestData(
  supplierId: string,
  count?: number,
): Promise<void> {
  await runCreateLetter({
    filter: "nhs-notify-supplier-api-letter-test-data-utility",
    supplierId,
    environment: envName,
    awsAccountId: "820178564574",
    groupId: "TestGroupID",
    specificationId: "TestSpecificationID",
    status: "PENDING",
    count: count || 1,
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

export async function checkSupplierExists(
  supplierId: string,
): Promise<boolean> {
  try {
    const params = {
      TableName: SUPPLIERTABLENAME,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": supplierId,
      },
    };

    const { Items } = await docClient.send(new QueryCommand(params));
    return Items !== undefined && Items.length > 0;
  } catch (error) {
    console.error("Error checking supplier existence:", error);
    return false;
  }
}

export async function createSupplierEntry(supplierId: string): Promise<void> {
  await createSupplierData({
    filter: "nhs-notify-supplier-api-suppliers-data-utility",
    supplierId,
    apimId: supplierId,
    name: "TestSupplier",
    environment: envName,
    status: "ENABLED",
  });
}
