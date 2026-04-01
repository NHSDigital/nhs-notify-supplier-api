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

async function pollLambdaLog(
  lambdaName: string,
  filterPatterns: string[],
  extraPatterns?: string[],
): Promise<string> {
  const intervalMs = 5000;
  const startTimeMs = Date.now() - 5 * 60_000;
  const timeoutMs = 120_000;

  const client = new CloudWatchLogsClient({ region: AWS_REGION });
  const logGroupName = `/aws/lambda/nhs-${envName}-supapi-${lambdaName}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await client.send(
      new FilterLogEventsCommand({
        logGroupName,
        startTime: startTimeMs,
        interleaved: true,
        limit: 100,
        filterPattern: filterPatterns.join(" "),
      }),
    );

    const foundEvent = (response.events ?? []).find((event) => {
      const message = event.message ?? "";
      return extraPatterns
        ? extraPatterns.some((pattern) => message.includes(pattern))
        : true;
    });
    if (foundEvent?.message) {
      return foundEvent.message;
    }

    await sleep(intervalMs);
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
  const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
  const supplierAllocatorLog = JSON.parse(message) as {
    msg?: { supplierSpec?: { supplierId?: string } };
  };
  const supplierId = supplierAllocatorLog.msg?.supplierSpec?.supplierId;

  logger.info(
    `Supplier ${supplierId} allocated for domainId ${domainId} in supplier allocator lambda`,
  );

  if (!supplierId) {
    throw new Error("supplierId was not found in supplier allocator log");
  }
  return supplierId;
}
