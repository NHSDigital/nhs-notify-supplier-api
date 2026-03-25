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

export async function pollSupplierAllocatorLogForResolvedSpec(
  domainId: string,
): Promise<string> {
  const intervalMs = 5000;
  const startTimeMs = Date.now() - 5 * 60_000;
  const timeoutMs = 120_000;

  const client = new CloudWatchLogsClient({ region: AWS_REGION });
  const logGroupName = `/aws/lambda/nhs-${envName}-supapi-supplier-allocator`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await client.send(
      new FilterLogEventsCommand({
        logGroupName,
        startTime: startTimeMs,
        interleaved: true,
        limit: 100,
        filterPattern: `"Sending message to upsert letter queue" "${domainId}"`,
      }),
    );

    const foundEvent = (response.events ?? []).find((event) => {
      const message = event.message ?? "";
      return (
        message.includes(
          '"description":"Sending message to upsert letter queue"',
        ) &&
        (!domainId || message.includes(domainId))
      );
    });
    if (foundEvent?.message) {
      return foundEvent.message;
    }

    await sleep(intervalMs);
  }

  throw new Error(
    `Timed out waiting for resolved supplier spec log in ${logGroupName}`,
  );
}

export async function pollUpsertLetterLogForError(
  msgToCheck: string,
  domainId?: string,
): Promise<string> {
  const intervalMs = 5000;
  const startTimeMs = Date.now() - 5 * 60_000;
  const timeoutMs = 120_000;

  const client = new CloudWatchLogsClient({ region: AWS_REGION });
  const logGroupName = `/aws/lambda/nhs-${envName}-supapi-upsertletter`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await client.send(
      new FilterLogEventsCommand({
        logGroupName,
        startTime: startTimeMs,
        interleaved: true,
        limit: 100,
        filterPattern: domainId
          ? `"Error processing upsert of record" "${domainId}"`
          : `"Error processing upsert of record"`,
      }),
    );

    const foundEvent = (response.events ?? []).find((event) => {
      const message = event.message ?? "";
      return (
        message.includes('"description":"Error processing upsert of record"') &&
        (message.includes(`"message":"${msgToCheck}`) ||
          message.includes(`"message": "${msgToCheck}`))
      );
    });

    if (foundEvent?.message) {
      return foundEvent.message;
    }

    await sleep(intervalMs);
  }

  throw new Error(
    `Timed out waiting for upsert letter error log in ${logGroupName}`,
  );
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
