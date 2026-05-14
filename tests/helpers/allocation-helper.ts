import { pollSupplierAllocatorLogForResolvedSpec } from "./aws-cloudwatch-helper";
import { logger } from "./pino-logger";

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

export async function getAllocationLogForDomainId(
  domainId: string,
): Promise<SupplierAllocatorLog> {
  const message = await pollSupplierAllocatorLogForResolvedSpec(domainId);
  const supplierAllocatorLog = JSON.parse(message) as SupplierAllocatorLog;

  logger.info({
    description: "Received supplier allocator log message",
    message: supplierAllocatorLog,
  });

  return supplierAllocatorLog;
}
