import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { AWS_REGION, envName } from "tests/constants/api-constants";
import { logger } from "./pino-logger";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// FilterLogEvents has a low account-wide TPS quota, and many Playwright workers
// poll it at once. Share one client so the adaptive retry rate limiter applies
// across all polls in a worker.
const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: AWS_REGION,
  retryMode: "adaptive",
  maxAttempts: 6,
});

const isThrottlingError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "ThrottlingException" ||
    error.name === "TooManyRequestsException");

async function pollLambdaLog(
  lambdaName: string,
  filterPatterns: string[],
  extraPatterns?: string[],
  startTimeMs?: number,
): Promise<string> {
  const intervalMs = 5000;
  const queryStartTimeMs = startTimeMs ?? Date.now() - 5 * 60_000;
  const timeoutMs = 120_000;

  const logGroupName = `/aws/lambda/nhs-${envName}-supapi-${lambdaName}`;
  const deadline = Date.now() + timeoutMs;

  // Returns null when throttled so the caller keeps polling until the deadline.
  const filterEvents = async () => {
    try {
      const response = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName,
          startTime: queryStartTimeMs,
          interleaved: true,
          limit: 100,
          filterPattern: filterPatterns.join(" "),
        }),
      );
      return response.events ?? [];
    } catch (error) {
      if (!isThrottlingError(error)) {
        throw error;
      }
      logger.warn(
        `FilterLogEvents throttled for ${logGroupName}; retrying until deadline`,
      );
      return null;
    }
  };

  while (Date.now() < deadline) {
    const events = await filterEvents();

    const foundEvent = (events ?? []).find((event) => {
      const message = event.message ?? "";
      return extraPatterns
        ? extraPatterns.some((pattern) => message.includes(pattern))
        : true;
    });

    if (foundEvent?.message) {
      return foundEvent.message;
    }

    await sleep(events ? intervalMs : intervalMs * 2);
  }

  throw new Error(`Timed out waiting for resolved log in ${logGroupName}`);
}

export async function pollSupplierAllocatorLogForResolvedSpec(
  domainId: string,
): Promise<string> {
  return pollLambdaLog("supplier-allocator", [
    '"Sending message to upsert letter queue"',
    `"${domainId}"`,
  ]);
}

export async function pollSupplierAllocatorLogForAllocationDetails(
  domainId: string,
): Promise<string> {
  return pollLambdaLog("supplier-allocator", [
    '"Fetched supplier details for supplier allocations"',
    `"${domainId}"`,
  ]);
}

export async function pollSupplierAllocatorLogForError(
  msgToCheck: string,
  domainId?: string,
): Promise<string> {
  const filterPatterns = ['"Error processing allocation of record"'];
  if (domainId) {
    filterPatterns.push(`"${domainId}"`);
  }
  return pollLambdaLog("supplier-allocator", filterPatterns, [
    `"message": "${msgToCheck}`,
    `"message":"${msgToCheck}`,
  ]);
}

export async function pollUpsertLetterLogForError(
  msgToCheck: string,
  domainId?: string,
): Promise<string> {
  const filterPatterns = ['"Error processing upsert of record"'];
  if (domainId) {
    filterPatterns.push(`"${domainId}"`);
  }
  return pollLambdaLog("upsertletter", filterPatterns, [
    `"message": "${msgToCheck}`,
    `"message":"${msgToCheck}`,
  ]);
}

export async function pollUpsertLetterLogForWarning(
  description: string,
  domainId: string,
): Promise<string> {
  const filterPatterns = ['"WARN"', `"${domainId}"`, `"${description}"`];
  return pollLambdaLog("upsertletter", filterPatterns);
}

export async function supplierIdFromSupplierAllocatorLog(
  domainId: string,
): Promise<string> {
  const allocationDetails =
    await pollSupplierAllocatorForAllocationDetails(domainId);

  const supplierId = allocationDetails?.supplierSpec?.supplierId;

  logger.info(
    `Supplier ${supplierId} allocated to letter ${domainId} in supplier allocator lambda`,
  );

  if (!supplierId) {
    throw new Error("supplierId was not found in supplier allocator log");
  }
  return supplierId;
}

export async function pollSupplierAllocatorForAllocationDetails(
  domainId: string,
) {
  const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
  const supplierAllocatorLog = JSON.parse(message) as {
    msg?: {
      allocationDetails?: {
        supplierSpec?: { supplierId?: string };
        allocationStatus?: { status?: string };
      };
    };
  };
  return supplierAllocatorLog.msg?.allocationDetails;
}

export async function pollAllocatorLog(description: string): Promise<string> {
  const filterPatterns = ['"INFO"', `"${description}"`];
  const log = await pollLambdaLog("supplier-allocator", filterPatterns);
  return log;
}

export type AllocatorLogPollOptions = {
  startTimeMs?: number;
  extraPatterns?: string[];
};

export async function pollAllocatorLogWithOptions(
  description: string,
  options?: AllocatorLogPollOptions,
): Promise<string> {
  const filterPatterns = [`"${description}"`];
  console.log(filterPatterns);
  const log = await pollLambdaLog(
    "supplier-allocator",
    filterPatterns,
    options?.extraPatterns,
    options?.startTimeMs,
  );
  return log;
}

export async function pollSupplierAllocatorLogForExceededDailyCapacity(
  supplierId: string,
): Promise<string> {
  const filterPatterns = [
    '"INFO"',
    '"Supplier has exceeded daily capacity"',
    `"${supplierId}"`,
  ];
  return pollLambdaLog("supplier-allocator", filterPatterns);
}
