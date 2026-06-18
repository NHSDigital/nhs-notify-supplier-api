import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import z from "zod";
import { SUPPLIER_QUOTAS_TABLENAME } from "../constants/api-constants";
import { logger } from "./pino-logger";

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

export const overallAllocationSchema = z.object({
  id: z.string(),
  volumeGroup: z.string(),
  allocations: z.record(z.string(), z.number()),
});

export const dailyAllocationSchema = z.object({
  id: z.string(),
  date: z.string(),
  allocations: z.record(z.string(), z.number()),
});

export async function getTotalAllocationForVolumeGroup(
  volumeGroupId: string,
): Promise<number> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: SUPPLIER_QUOTAS_TABLENAME,
        Key: { pk: "ENTITY#overall-allocation", sk: `ID#${volumeGroupId}` },
      }),
    );
    logger.info(`Selecting from table name: ${SUPPLIER_QUOTAS_TABLENAME}`);

    if (!result.Item) {
      logger.warn(
        `No overall allocation found for volume group ${volumeGroupId}`,
      );
      return 0; // Default to 0 if no allocation record exists
    }
    // Strip DynamoDB keys before parsing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pk, sk, ...item } = result.Item;
    const overallAllocation = overallAllocationSchema.parse(item);

    logger.info(
      `Fetched overall allocation for volume group ${volumeGroupId}: ${JSON.stringify(overallAllocation)}`,
    );
    const { allocations } = overallAllocation;

    const totalAllocation = Object.values(allocations).reduce(
      (sum, allocation) => sum + allocation,
      0,
    );
    logger.info(
      `Fetched overall allocation for volume group ${volumeGroupId}: ${totalAllocation}`,
    );
    return totalAllocation;
  } catch (error) {
    logger.error(
      `Error fetching overall allocation for volume group ${volumeGroupId}: ${error}`,
    );
    throw error;
  }
}
export async function getTotalDailyAllocation(
  allocationDate: string,
): Promise<number> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: SUPPLIER_QUOTAS_TABLENAME,
        Key: { pk: "ENTITY#daily-allocation", sk: `ID#${allocationDate}` },
      }),
    );
    logger.info(`Selecting from table name: ${SUPPLIER_QUOTAS_TABLENAME}`);

    if (!result.Item) {
      logger.warn(`No daily allocation found for date ${allocationDate}`);
      return 0; // Default to 0 if no allocation record exists
    }
    // Strip DynamoDB keys before parsing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pk, sk, ...item } = result.Item;
    const dailyAllocation = dailyAllocationSchema.parse(item);

    logger.info(
      `Fetched daily allocation for date ${allocationDate}: ${JSON.stringify(dailyAllocation)}`,
    );
    const { allocations } = dailyAllocation;

    const totalAllocation = Object.values(allocations).reduce(
      (sum, allocation) => sum + allocation,
      0,
    );
    logger.info(
      `Fetched daily allocation for date ${allocationDate}: ${totalAllocation}`,
    );
    return totalAllocation;
  } catch (error) {
    logger.error(
      `Error fetching daily allocation for date ${allocationDate}: ${error}`,
    );
    throw error;
  }
}
