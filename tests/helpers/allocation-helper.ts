import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { envName } from "tests/constants/api-constants";
import {
  pollAllocatorLogForPackSpec,
  pollSupplierAllocatorLogForExceededDailyCapacity,
  pollSupplierAllocatorLogForResolvedSpec,
} from "./aws-cloudwatch-helper";

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

export const AllocationTestVariantMap: Record<string, number> = {
  "notify-standard-test1": 1,
  "client1-campaign1": 2,
};

export function getVariantsForAllocation(testCase: number) {
  const variants = Object.keys(AllocationTestVariantMap).filter(
    // safe as comes from map's keys which are controlled by us
    // eslint-disable-next-line security/detect-object-injection
    (variant) => AllocationTestVariantMap[variant] === testCase,
  );
  if (variants.length === 0) {
    throw new Error(`No variants found with testCase ${testCase}`);
  }
  return variants[0];
}

export type SupplierAllocatorLog = {
  msg?: {
    allocationDetails?: {
      supplierSpec?: {
        supplierId?: string;
        specId?: string;
        billingId?: string;
      };
      allocationStatus?: {
        status?: "PENDING" | "REJECTED";
        reasonCode?: string;
      };
    };
  };
};

type PackSpecificationLog = {
  description: string;
  packSpecId?: string;
  pageCount?: number;
  constraintValue?: number;
  constraintOperator?: string;
};

type LetterVariantConfig = {
  id: string;
  packSpecificationIds: string[];
};

type DailyAllocationConfig = {
  id: string;
  date: string;
  allocations: Record<string, number>;
};

export type SupplierDailyCapacityExceededLog = {
  level?: string;
  timestamp?: string;
  pid?: number;
  hostname?: string;
  description?: string;
  supplierId?: string;
  allocated?: number;
  dailyCapacity?: number;
};

const getSupplierConfigTableName = (): string =>
  process.env.SUPPLIER_CONFIG_TABLE_NAME ??
  `nhs-${envName}-supapi-supplier-config`;

const getSupplierQuotasTableName = (): string =>
  process.env.SUPPLIER_QUOTAS_TABLE_NAME ?? "nhs-pr578-supapi-supplier-quotas";

const getAllocationDate = (): string => new Date().toISOString().slice(0, 10);

export async function getAllocationLogForDomainId(
  domainId: string,
): Promise<SupplierAllocatorLog> {
  const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
  const supplierAllocatorLog = JSON.parse(message) as SupplierAllocatorLog;

  return supplierAllocatorLog;
}

export async function getAllocationPackSpecLog(
  description: string,
): Promise<PackSpecificationLog> {
  const message = await pollAllocatorLogForPackSpec(description);
  const packSpecificationLog = JSON.parse(message) as PackSpecificationLog;
  return packSpecificationLog;
}

export async function getExceededDailyCapacityLog(
  supplierId: string,
  allocated: number,
  dailyCapacity: number,
): Promise<SupplierDailyCapacityExceededLog> {
  const message =
    await pollSupplierAllocatorLogForExceededDailyCapacity(supplierId);
  const exceededCapacityLog = JSON.parse(
    message,
  ) as SupplierDailyCapacityExceededLog;

  if (
    exceededCapacityLog.description !== "Supplier has exceeded daily capacity"
  ) {
    throw new Error(
      `Unexpected log description: ${exceededCapacityLog.description}`,
    );
  }
  if (exceededCapacityLog.supplierId !== supplierId) {
    throw new Error(
      `Unexpected supplierId in log: ${exceededCapacityLog.supplierId}`,
    );
  }
  if (exceededCapacityLog.allocated !== allocated) {
    throw new Error(
      `Unexpected allocated value in log: ${exceededCapacityLog.allocated}`,
    );
  }
  if (exceededCapacityLog.dailyCapacity !== dailyCapacity) {
    throw new Error(
      `Unexpected dailyCapacity value in log: ${exceededCapacityLog.dailyCapacity}`,
    );
  }

  return exceededCapacityLog;
}

export async function getLetterVariantConfigFromDb(
  letterVariantId: string,
): Promise<LetterVariantConfig> {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: getSupplierConfigTableName(),
      Key: {
        pk: "ENTITY#letter-variant",
        sk: `ID#${letterVariantId}`,
      },
    }),
  );

  if (!Item) {
    throw new Error(
      `Letter variant config was not found in supplier config table for id ${letterVariantId}`,
    );
  }

  return Item as LetterVariantConfig;
}

export async function getLetterDailyAllocationFromDb(
  allocationDate: string = getAllocationDate(),
): Promise<DailyAllocationConfig> {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: getSupplierQuotasTableName(),
      Key: {
        pk: "ENTITY#daily-allocation",
        sk: `ID#${allocationDate}`,
      },
    }),
  );

  if (!Item) {
    throw new Error(
      `Letter daily allocation was not found in supplier config table for date ${allocationDate}`,
    );
  }

  return Item as DailyAllocationConfig;
}

export async function updateSupplierDailyAllocation(
  supplierId: string,
  allocation: number,
  allocationDate: string = getAllocationDate(),
): Promise<void> {
  const now = new Date().toISOString();

  const key = {
    pk: "ENTITY#daily-allocation",
    sk: `ID#${allocationDate}`,
  };

  await docClient.send(
    new UpdateCommand({
      TableName: getSupplierQuotasTableName(),
      Key: key,
      UpdateExpression: `
        SET
          allocations.#supplierId = :allocation,
          id = if_not_exists(id, :id),
          #date = if_not_exists(#date, :date),
          createdAt = if_not_exists(createdAt, :now),
          updatedAt = :now
      `,
      ExpressionAttributeNames: {
        "#supplierId": supplierId,
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":allocation": allocation,
        ":id": `ID#${allocationDate}`,
        ":date": allocationDate,
        ":now": now,
      },
    }),
  );
}
