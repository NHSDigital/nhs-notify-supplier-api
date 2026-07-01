import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { envName } from "tests/constants/api-constants";
import {
  pollAllocatorLogWithOptions,
  pollSupplierAllocatorLogForAllocationDetails,
  pollSupplierAllocatorLogForExceededDailyCapacity,
  pollSupplierAllocatorLogForResolvedSpec,
} from "./aws-cloudwatch-helper";

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

export const AllocationTestVariantMap: Record<string, number> = {
  "notify-standard-test1": 1,
  "client1-campaign1": 2,
  "notify-standard-colour": 3,
  "client1-campaign2": 4,
  "notify-first-test": 5,
  "client1-campaign8": 6,
  "client1-campaign7": 7,
  "notify-standard": 8,
};

export function getVariantsForAllocation(testCase: number) {
  const variants = Object.keys(AllocationTestVariantMap).filter(
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

export type PackErrorLog = {
  description: string;
  letterVariantId?: string;
  packSpecificationIds?: string[];
};

export type SupplierFactorEntry = {
  supplierId: string;
  factor: number;
};

export type SupplierFactorLog = {
  description: string;
  supplierFactors?: SupplierFactorEntry[];
};

export type AllocationLogOptions = {
  startTimeMs?: number;
  extraPatterns?: string[];
};

export type AllocatedSuppliersLogEntry = {
  id: string;
  name: string;
  channelType: string;
  dailyCapacity: number;
  status: string;
};

export type FetchedSupplierLog = {
  supplierAllocationIds?: string[];
  allocatedSuppliers?: AllocatedSuppliersLogEntry[];
  allSuppliersForPack?: string[];
  supplierForPackWithCapacity?: string[];
  selectedSupplierId?: string;
};

type LetterVariantConfig = {
  id: string;
  packSpecificationIds: string[];
  constraints: {
    blackCoveragePercentage: Record<string, number>;
    deliveryDays: Record<string, number>;
    sides: Record<string, number>;
    sheets: Record<string, number>;
  };
  volumeGroupId: string;
};

type DailyAllocationConfig = {
  id: string;
  date: string;
  allocations: Record<string, number>;
};

type OverallAllocationConfig = {
  id: string;
  volumeGroup: string;
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
  process.env.SUPPLIER_QUOTAS_TABLE_NAME ??
  `nhs-${envName}-supapi-supplier-quotas`;

const getAllocationDate = (): string => new Date().toISOString().slice(0, 10);

export async function getAllocationLogForDomainId(
  domainId: string,
): Promise<SupplierAllocatorLog> {
  const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
  const supplierAllocatorLog = JSON.parse(message) as SupplierAllocatorLog;

  return supplierAllocatorLog;
}

export async function getAllocationDetailsForDomainId(
  domainId: string,
): Promise<FetchedSupplierLog> {
  const message = await pollSupplierAllocatorLogForAllocationDetails(domainId);
  const fetchedSupplierLog = JSON.parse(message) as FetchedSupplierLog;

  return fetchedSupplierLog;
}

export async function getAllocationLog<
  TLog extends { description: string } = PackSpecificationLog,
>(description: string, options?: AllocationLogOptions): Promise<TLog> {
  const message = await pollAllocatorLogWithOptions(description, options);
  const allocationLog = JSON.parse(message) as TLog;
  return allocationLog;
}

export async function getExceededDailyCapacityLog(
  supplierId: string,
): Promise<SupplierDailyCapacityExceededLog> {
  const message =
    await pollSupplierAllocatorLogForExceededDailyCapacity(supplierId);
  return JSON.parse(message) as SupplierDailyCapacityExceededLog;
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

export async function getOverallAllocationFromDb(
  volumeGroupId: string,
): Promise<OverallAllocationConfig> {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: getSupplierQuotasTableName(),
      Key: {
        pk: "ENTITY#overall-allocation",
        sk: `ID#${volumeGroupId}`,
      },
    }),
  );

  if (!Item) {
    throw new Error(
      `Overall allocation was not found in supplier config table for volume group ${volumeGroupId}`,
    );
  }

  return Item as OverallAllocationConfig;
}

export async function seedLetterDailyAllocation(
  allocations: Record<string, number>,
  allocationDate: string = getAllocationDate(),
): Promise<DailyAllocationConfig> {
  const now = new Date().toISOString();
  const item: DailyAllocationConfig & {
    pk: string;
    sk: string;
    createdAt: string;
    updatedAt: string;
  } = {
    pk: "ENTITY#daily-allocation",
    sk: `ID#${allocationDate}`,
    id: `ID#${allocationDate}`,
    date: allocationDate,
    allocations,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: getSupplierQuotasTableName(),
      Item: item,
      ConditionExpression: "attribute_not_exists(pk)",
    }),
  );

  return item;
}

export async function seedOverallAllocation(
  allocations: Record<string, number>,
  volumeGroupId: string,
): Promise<OverallAllocationConfig> {
  const now = new Date().toISOString();
  const item: OverallAllocationConfig & {
    pk: string;
    sk: string;
    createdAt: string;
    updatedAt: string;
  } = {
    pk: "ENTITY#overall-allocation",
    sk: `ID#${volumeGroupId}`,
    id: volumeGroupId,
    volumeGroup: volumeGroupId,
    allocations,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: getSupplierQuotasTableName(),
      Item: item,
      ConditionExpression: "attribute_not_exists(pk)",
    }),
  );

  return item;
}

export async function getOrSeedLetterDailyAllocationFromDb(
  defaultAllocations: Record<string, number>,
  allocationDate: string = getAllocationDate(),
): Promise<DailyAllocationConfig> {
  try {
    return await getLetterDailyAllocationFromDb(allocationDate);
  } catch {
    return seedLetterDailyAllocation(defaultAllocations, allocationDate);
  }
}

export async function getOrSeedOverallAllocationFromDb(
  defaultAllocations: Record<string, number>,
  volumeGroupId: string,
): Promise<OverallAllocationConfig> {
  try {
    return await getOverallAllocationFromDb(volumeGroupId);
  } catch {
    return seedOverallAllocation(defaultAllocations, volumeGroupId);
  }
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

export async function updateSupplierOverallAllocation(
  supplierId: string,
  allocation: number,
  volumeGroupId: string,
): Promise<void> {
  const now = new Date().toISOString();

  const key = {
    pk: "ENTITY#overall-allocation",
    sk: `ID#${volumeGroupId}`,
  };

  await docClient.send(
    new UpdateCommand({
      TableName: getSupplierQuotasTableName(),
      Key: key,
      UpdateExpression: `
        SET
          allocations.#supplierId = :allocation,
          id = if_not_exists(id, :id),
          volumeGroup = if_not_exists(volumeGroup, :volumeGroup),
          createdAt = if_not_exists(createdAt, :now),
          updatedAt = :now
      `,
      ExpressionAttributeNames: {
        "#supplierId": supplierId,
      },
      ExpressionAttributeValues: {
        ":allocation": allocation,
        ":id": volumeGroupId,
        ":volumeGroup": volumeGroupId,
        ":now": now,
      },
    }),
  );
}

export async function updateVolumeGroupData(
  volumeGroupId: string,
  targetDate: string,
  fieldName: string,
) {
  const key = {
    pk: "ENTITY#volume-group",
    sk: `ID#${volumeGroupId}`,
  };

  await docClient.send(
    new UpdateCommand({
      TableName: getSupplierConfigTableName(),
      Key: key,
      UpdateExpression:
        fieldName === "endDate"
          ? "SET endDate = :targetDate, updatedAt = :updatedAt"
          : "SET startDate = :targetDate, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":targetDate": targetDate,
        ":updatedAt": targetDate,
      },
      ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
    }),
  );
}

export async function getVolumeGroupData(volumeGroupId: string): Promise<any> {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: getSupplierConfigTableName(),
      Key: {
        pk: "ENTITY#volume-group",
        sk: `ID#${volumeGroupId}`,
      },
    }),
  );

  if (!Item) {
    throw new Error(
      `Volume group data was not found in supplier config table for id ${volumeGroupId}`,
    );
  }

  return Item;
}

export async function updateSupplierAllocation(
  supplierId: string,
  volumeGroupId: string,
  allocation: number,
): Promise<void> {
  const now = new Date().toISOString();
  const key = {
    pk: "ENTITY#supplier-allocation",
    sk: `ID#${supplierId}-${volumeGroupId}`,
  };

  await docClient.send(
    new UpdateCommand({
      TableName: getSupplierConfigTableName(),
      Key: key,
      UpdateExpression: `
        SET
          allocationPercentage = :allocationPercentage,
          updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":allocationPercentage": allocation,
        ":now": now,
      },
      ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
    }),
  );
}

export async function updateLetterVariantPackSpecs(
  letterVariantId: string,
  packSpecificationIds: string[],
) {
  const now = new Date().toISOString();
  const key = {
    pk: "ENTITY#letter-variant",
    sk: `ID#${letterVariantId}`,
  };
  await docClient.send(
    new UpdateCommand({
      TableName: getSupplierConfigTableName(),
      Key: key,
      UpdateExpression: `
          SET
            packSpecificationIds = :packSpecificationIds,
            updatedAt = :now
        `,
      ExpressionAttributeValues: {
        ":packSpecificationIds": packSpecificationIds,
        ":now": now,
      },
      ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
    }),
  );
}

export async function getSupplierFromSupplierPack(
  packSpecificationId: string,
): Promise<string[]> {
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName: getSupplierConfigTableName(),
      IndexName: "packSpecificationId-index",
      KeyConditionExpression:
        "#pk = :pk AND #packSpecificationId = :packSpecificationId",
      FilterExpression: "#status = :status AND #approval = :approval",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#packSpecificationId": "packSpecificationId",
        "#status": "status",
        "#approval": "approval",
      },
      ExpressionAttributeValues: {
        ":pk": "ENTITY#supplier-pack",
        ":packSpecificationId": packSpecificationId,
        ":status": "PROD",
        ":approval": "APPROVED",
      },
    }),
  );

  if (!Items || Items.length === 0) {
    throw new Error(
      `No suppliers found for pack specification ${packSpecificationId}`,
    );
  }

  return Items.map((item) => String(item.supplierId));
}
