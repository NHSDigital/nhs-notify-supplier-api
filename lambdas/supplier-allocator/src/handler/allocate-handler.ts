import { Context, SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  LetterVariant,
  PackSpecification,
  Supplier,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { Unit } from "aws-embedded-metrics";
import {
  MetricEntry,
  MetricStatus,
  buildEMFObject,
  formatGroupId,
} from "@internal/helpers";
import {
  IdempotencyConfig,
  makeIdempotent,
} from "@aws-lambda-powertools/idempotency";
import {
  getVariantDetails,
  getVolumeGroupDetails,
} from "../services/supplier-config";
import { updateSupplierAllocation } from "../services/supplier-quotas";
import {
  eligibleSuppliers,
  filterSuppliersWithCapacity,
  preferredSupplierPack,
  selectSupplierByFactor,
  suppliersWithValidPack,
} from "./allocation-config";
import { Deps } from "../config/deps";
import { PreparedEventSchema, PreparedEvents, SupplierDetails } from "./types";

const idempotencyConfig = new IdempotencyConfig({
  eventKeyJmesPath: "data.domainId",
});

function parseQueueMessage(queueMessage: string): PreparedEvents {
  const result = PreparedEventSchema.safeParse(queueMessage);

  if (!result.success) {
    throw new Error(
      `Message did not match an expected schema: ${JSON.stringify(
        result.error.issues,
      )}`,
    );
  }
  return result.data;
}

function buildSupplierDetails(
  supplierId: string,
  packSpecificationId: string,
  billingId: string,
  priority: number,
  status: "PENDING" | "REJECTED",
  volumeGroupId: string,
  reasonCode?: string,
  reasonText?: string,
): SupplierDetails {
  return {
    allocationDetails: {
      supplierSpec: {
        supplierId,
        specId: packSpecificationId,
        priority,
        billingId,
      },
      allocationStatus: {
        status,
        reasonCode,
        reasonText,
      },
    },
    volumeGroupId,
  };
}

async function getSupplierFromConfig(
  letterEvent: PreparedEvents,
  deps: Deps,
): Promise<SupplierDetails> {
  try {
    const letterVariant: LetterVariant = await getVariantDetails(
      letterEvent.data.letterVariantId,
      deps,
    );

    const volumeGroup: VolumeGroup = await getVolumeGroupDetails(
      letterVariant.volumeGroupId,
      deps,
    );

    const { supplierAllocations, suppliers: allocatedSuppliers } =
      await eligibleSuppliers(volumeGroup, deps, letterVariant.supplierId);

    const preferredPack: PackSpecification = await preferredSupplierPack(
      letterEvent,
      allocatedSuppliers,
      letterVariant.packSpecificationIds,
      deps,
    );

    const allSuppliersForPack: Supplier[] = await suppliersWithValidPack(
      allocatedSuppliers,
      preferredPack.id,
      deps,
    );

    if (allSuppliersForPack.length === 0) {
      throw new Error(
        `No suppliers found for pack specification ${preferredPack.id}`,
      );
    }

    const suppliersForPackWithCapacity: Supplier[] =
      await filterSuppliersWithCapacity(allSuppliersForPack, deps);

    // selected supplier id is determined by first calling selectSupplierByFactor for suppliers with capacity
    // and if that returns nothing, try again with all suppliers for the pack
    const selectedSupplierId =
      (suppliersForPackWithCapacity.length > 0
        ? await selectSupplierByFactor(
            suppliersForPackWithCapacity,
            supplierAllocations,
            letterEvent.data.domainId,
            deps,
          )
        : undefined) ??
      (await selectSupplierByFactor(
        allSuppliersForPack,
        supplierAllocations,
        letterEvent.data.domainId,
        deps,
      ));

    deps.logger.info({
      description: "Fetched supplier details for supplier allocations",
      domainId: letterEvent.data.domainId,
      variantId: letterEvent.data.letterVariantId,
      volumeGroupId: volumeGroup.id,
      supplierAllocationIds: supplierAllocations.map((a) => a.id),
      allocatedSuppliers,
      allSuppliersForPack: allSuppliersForPack.map((s) => s.id),
      suppliersForPackWithCapacity: suppliersForPackWithCapacity.map(
        (s) => s.id,
      ),
      selectedSupplierId,
    });

    return buildSupplierDetails(
      selectedSupplierId,
      preferredPack.id,
      preferredPack.billingId,
      letterVariant.priority,
      "PENDING",
      volumeGroup.id,
    );
  } catch (error) {
    deps.logger.error({
      description: "Error fetching supplier from config",
      err: error,
      variantId: letterEvent.data.letterVariantId,
    });
    return buildSupplierDetails(
      "unknown",
      "unknown",
      "unknown",
      0,
      "REJECTED",
      "unknown",
      "NO_SUPPLIERS_AVAILABLE",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

type AllocationMetrics = Map<string, Map<string, number>>;
type VolumeGroupAllocation = Map<string, Record<string, number>>;

function incrementMetric(
  map: AllocationMetrics,
  supplier: string,
  priority: string,
) {
  const byPriority = map.get(supplier) ?? new Map<string, number>();
  byPriority.set(priority, (byPriority.get(priority) ?? 0) + 1);
  map.set(supplier, byPriority);
}

function emitMetrics(
  metrics: AllocationMetrics,
  status: MetricStatus,
  deps: Deps,
) {
  const namespace = "supplier-allocator";
  for (const [supplier, byPriority] of metrics) {
    for (const [priority, count] of byPriority) {
      const dimensions: Record<string, string> = {
        Priority: priority,
        Supplier: supplier,
      };
      const metric: MetricEntry = {
        key: status,
        value: count,
        unit: Unit.Count,
      };
      deps.logger.info(buildEMFObject(namespace, dimensions, metric));
    }
  }
}

function emitDataMetrics(
  letterEvent: PreparedEvents,
  supplier: string,
  metricKey: string,
  deps: Deps,
) {
  const namespace = "supplier-allocator";
  const { campaignId, clientId, templateId } = letterEvent.data;
  const dimensions: Record<string, string> = {
    Supplier: supplier,
    ClientId: clientId,
    CampaignId: campaignId || "unknown",
    TemplateId: templateId || "unknown",
    GroupId: formatGroupId(clientId, campaignId, templateId),
  };
  const metric: MetricEntry = {
    key: metricKey,
    value: 1,
    unit: Unit.Count,
  };
  deps.logger.info(buildEMFObject(namespace, dimensions, metric));
}

function incrementAllocation(
  volumeGroupAllocations: VolumeGroupAllocation,
  volumeGroupId: string,
  supplierId: string,
  allocation: number,
  deps: Deps,
) {
  const groupAllocations = volumeGroupAllocations.get(volumeGroupId) ?? {};
  groupAllocations[supplierId] =
    (groupAllocations[supplierId] ?? 0) + allocation;
  volumeGroupAllocations.set(volumeGroupId, groupAllocations);
  deps.logger.info({
    description: "Updated allocations for volume group and supplier",
    volumeGroupId,
    groupAllocations,
    setVolumeGroupAllocations: volumeGroupAllocations.get(volumeGroupId),
  });
}

async function saveAllocations(
  deps: Deps,
  volumeGroupAllocations: VolumeGroupAllocation,
) {
  for (const [volumeGroupId, allocations] of volumeGroupAllocations) {
    for (const [supplierId, allocation] of Object.entries(allocations)) {
      await updateSupplierAllocation(
        volumeGroupId,
        supplierId,
        allocation,
        deps,
      );
    }
  }
}

type SupplierAllocationResult = {
  priority: string;
  supplier: string;
};

async function processSupplierAllocation(
  letterEvent: PreparedEvents,
  deps: Deps,
  perAllocationSuccess: AllocationMetrics,
  perAllocationFailure: AllocationMetrics,
  volumeGroupAllocations: VolumeGroupAllocation,
): Promise<SupplierAllocationResult> {
  const supplierDetails: SupplierDetails = await getSupplierFromConfig(
    letterEvent,
    deps,
  );
  deps.logger.info({
    description: "Resolved supplier details from config",
    supplierDetails,
  });
  const supplierSpec = supplierDetails?.allocationDetails?.supplierSpec;

  const supplier = supplierSpec.supplierId;
  const priority = String(supplierSpec.priority);

  if (supplierDetails.allocationDetails.allocationStatus.status === "PENDING") {
    incrementMetric(perAllocationSuccess, supplier, priority);
    emitDataMetrics(letterEvent, supplier, "extra_data_dimensions", deps);

    incrementAllocation(
      volumeGroupAllocations,
      supplierDetails.volumeGroupId,
      supplier,
      1,
      deps,
    );
  } else {
    incrementMetric(perAllocationFailure, supplier, priority);
  }

  // Send to allocated letters queue
  const queueUrl = process.env.UPSERT_LETTERS_QUEUE_URL;
  if (!queueUrl) {
    throw new Error("UPSERT_LETTERS_QUEUE_URL not configured");
  }

  const queueMessage = {
    letterEvent,
    allocationDetails: supplierDetails.allocationDetails,
  };

  deps.logger.info({
    description: "Sending message to upsert letter queue",
    msg: queueMessage,
    url: queueUrl,
  });

  await deps.sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(queueMessage),
    }),
  );
  return {
    priority,
    supplier,
  };
}

export default function createSupplierAllocatorHandler(deps: Deps): SQSHandler {
  const createGetSupplierIdempotently = (
    perAllocationSuccess: AllocationMetrics,
    perAllocationFailure: AllocationMetrics,
    volumeGroupAllocations: VolumeGroupAllocation,
  ) => {
    return makeIdempotent(
      (letterEvent: PreparedEvents, depsInner: Deps) =>
        processSupplierAllocation(
          letterEvent,
          depsInner,
          perAllocationSuccess,
          perAllocationFailure,
          volumeGroupAllocations,
        ),
      {
        persistenceStore: deps.idempotencyLayer,
        config: idempotencyConfig,
      },
    );
  };
  return async (event: SQSEvent, context: Context) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];
    const perAllocationSuccess: AllocationMetrics = new Map();
    const perAllocationFailure: AllocationMetrics = new Map();
    const volumeGroupAllocations: VolumeGroupAllocation = new Map();

    // create an idempotent function bound to this handler's global variables to track metrics and allocations
    const getSupplierIdempotently = createGetSupplierIdempotently(
      perAllocationSuccess,
      perAllocationFailure,
      volumeGroupAllocations,
    );

    const tasks = event.Records.map(async (record) => {
      let supplier = "unknown";
      let priority = "unknown";
      try {
        const sqsMessage = JSON.parse(record.body);

        const letterEvent: PreparedEvents = parseQueueMessage(sqsMessage);
        deps.logger.info({
          description: "Extracted letter event",
          messageId: record.messageId,
          domainId: letterEvent.data.domainId,
          letterVariantId: letterEvent.data.letterVariantId,
        });

        idempotencyConfig.registerLambdaContext(context);

        const supplierAllocationResult: SupplierAllocationResult =
          await getSupplierIdempotently(letterEvent, deps);

        ({ priority, supplier } = supplierAllocationResult);
      } catch (error) {
        console.log(
          `Error processing allocation of record ${record.messageId}: ${error}`,
        );
        deps.logger.error({
          description: "Error processing allocation of record",
          err: error,
          messageId: record.messageId,
          message: record.body,
        });
        incrementMetric(perAllocationFailure, supplier, priority);
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    emitMetrics(perAllocationSuccess, MetricStatus.Success, deps);
    emitMetrics(perAllocationFailure, MetricStatus.Failure, deps);
    await saveAllocations(deps, volumeGroupAllocations);
    return { batchItemFailures };
  };
}
