import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  LetterVariant,
  PackSpecification,
  Supplier,
  SupplierAllocation,
  SupplierPack,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import z from "zod";
import { Unit } from "aws-embedded-metrics";
import { MetricEntry, MetricStatus, buildEMFObject } from "@internal/helpers";
import {
  filterPacksForLetter,
  getPackSpecification,
  getPreferredSupplierPacks,
  getSupplierAllocationsForVolumeGroup,
  getSupplierDetails,
  getSuppliersWithValidPack,
  getVariantDetails,
  getVolumeGroupDetails,
} from "../services/supplier-config";
import {
  calculateSupplierAllocatedFactor,
  updateSupplierAllocation,
} from "../services/supplier-quotas";
import { Deps } from "../config/deps";

type SupplierSpec = {
  supplierId: string;
  specId: string;
  priority: number;
  billingId: string;
};

type SupplierDetails = {
  supplierSpec: SupplierSpec;
  volumeGroupId: string;
};

type PreparedEvents = LetterRequestPreparedEventV2 | LetterRequestPreparedEvent;

// small envelope that must exist in all inputs
const TypeEnvelope = z.object({ type: z.string().min(1) });

function resolveSupplierForVariant(
  variantId: string,
  deps: Deps,
): SupplierSpec {
  deps.logger.info({
    description: "Resolving supplier for letter variant",
    variantId,
  });
  const supplier = deps.env.VARIANT_MAP[variantId];
  if (!supplier) {
    deps.logger.error({
      description: "No supplier mapping found for variant",
      variantId,
    });
    throw new Error(`No supplier mapping for variantId: ${variantId}`);
  }

  return supplier;
}

function validateType(event: unknown) {
  const env = TypeEnvelope.safeParse(event);
  if (!env.success) {
    throw new Error("Missing or invalid envelope.type field");
  }
  if (
    !env.data.type.startsWith(
      "uk.nhs.notify.letter-rendering.letter-request.prepared",
    )
  ) {
    throw new Error(`Unexpected event type: ${env.data.type}`);
  }
}

async function getSupplierFromConfig(
  letterEvent: PreparedEvents,
  deps: Deps,
): Promise<SupplierDetails | undefined> {
  try {
    const variantDetails: LetterVariant = await getVariantDetails(
      letterEvent.data.letterVariantId,
      deps,
    );

    const volumeGroupDetails: VolumeGroup = await getVolumeGroupDetails(
      variantDetails.volumeGroupId,
      deps,
    );

    const supplierAllocations: SupplierAllocation[] =
      await getSupplierAllocationsForVolumeGroup(
        variantDetails.volumeGroupId,
        deps,
        variantDetails.supplierId,
      );

    const supplierIds = supplierAllocations.map((alloc) => alloc.supplier);

    const allocatedSuppliers: Supplier[] = await getSupplierDetails(
      supplierIds,
      deps,
    );

    const eligiblePacks: string[] = await filterPacksForLetter(
      letterEvent,
      variantDetails.packSpecificationIds,
      deps,
    );

    const preferredSupplierPacks: SupplierPack[] =
      await getPreferredSupplierPacks(eligiblePacks, allocatedSuppliers, deps);

    const preferredPack: PackSpecification = await getPackSpecification(
      preferredSupplierPacks[0].packSpecificationId,
      deps,
    );

    const suppliersForPack: Supplier[] = await getSuppliersWithValidPack(
      allocatedSuppliers,
      preferredPack.id,
      deps,
    );

    let supplierAllocationsForPack: SupplierAllocation[] = [];
    let supplierFactors: { supplierId: string; factor: number }[] = [];
    let selectedSupplierId = "unknown"; // Default to first supplier if no allocations or factors can be calculated
    if (suppliersForPack && suppliersForPack.length > 0) {
      supplierAllocationsForPack = supplierAllocations.filter((alloc) =>
        suppliersForPack.some((supplier) => supplier.id === alloc.supplier),
      );

      supplierFactors = await calculateSupplierAllocatedFactor(
        supplierAllocationsForPack,
        deps,
      );

      // Get the supplierid with the lowest factor
      selectedSupplierId = supplierFactors[0].supplierId;
      let lowestFactor = supplierFactors[0].factor;
      for (const supplierFactor of supplierFactors) {
        if (supplierFactor.factor < lowestFactor) {
          lowestFactor = supplierFactor.factor;
          selectedSupplierId = supplierFactor.supplierId;
        }
      }
    }

    deps.logger.info({
      description: "Fetched supplier details for supplier allocations",
      variantId: letterEvent.data.letterVariantId,
      volumeGroupId: volumeGroupDetails.id,
      supplierAllocationIds: supplierAllocations.map((a) => a.id),
      allocatedSuppliers,
      variantPacks: variantDetails.packSpecificationIds,
      eligiblePacks,
      preferredSupplierPacks,
      preferredPack,
      suppliersForPack,
      supplierAllocationsForPack,
      supplierFactors,
      selectedSupplierId,
    });

    const supplierDetails: SupplierDetails = {
      supplierSpec: {
        supplierId: selectedSupplierId,
        specId: preferredPack.id,
        priority: 0,
        billingId: preferredPack.billingId,
      },
      volumeGroupId: volumeGroupDetails.id,
    };
    deps.logger.info({
      description: "Resolved supplier details for letter event",
      supplierDetails,
    });
    return supplierDetails;
  } catch (error) {
    deps.logger.error({
      description: "Error fetching supplier from config",
      err: error,
      variantId: letterEvent.data.letterVariantId,
    });
    return undefined;
  }
}

function getSupplier(letterEvent: PreparedEvents, deps: Deps): SupplierSpec {
  return resolveSupplierForVariant(letterEvent.data.letterVariantId, deps);
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

function incrementAllocation(
  map: VolumeGroupAllocation,
  volumeGroupId: string,
  supplierId: string,
  allocation: number,
  deps: Deps,
) {
  deps.logger.info({
    description: "Incrementing allocation for volume group and supplier",
    volumeGroupId,
    supplierId,
    allocation,
  });
  const groupAllocations = map.get(volumeGroupId) ?? {};
  groupAllocations[supplierId] =
    (groupAllocations[supplierId] ?? 0) + allocation;
  map.set(volumeGroupId, groupAllocations);
  deps.logger.info({
    description: "Updated allocations for volume group and supplier",
    volumeGroupId,
    groupAllocations,
  });
}

async function saveAllocations(
  deps: Deps,
  volumeGroupAllocations: VolumeGroupAllocation,
) {
  deps.logger.info({
    description: "Saving supplier allocations for volume groups",
    volumeGroupAllocations,
  });
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

export default function createSupplierAllocatorHandler(deps: Deps): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];
    const perAllocationSuccess: AllocationMetrics = new Map();
    const perAllocationFailure: AllocationMetrics = new Map();
    const volumeGroupAllocations: VolumeGroupAllocation = new Map(); // Map of volume group id to supplier allocations for that group, used to track the allocations calculated in this batch for emitting metrics and updating the quotas after processing the batch
    // Initialise the supplier quotas.

    const tasks = event.Records.map(async (record) => {
      let supplier = "unknown";
      let priority = "unknown";
      try {
        const letterEvent: unknown = JSON.parse(record.body);

        deps.logger.info({
          description: "Extracted letter event",
          messageId: record.messageId,
        });

        validateType(letterEvent);

        const supplierSpec = getSupplier(letterEvent as PreparedEvents, deps);
        const supplierDetails = await getSupplierFromConfig(
          letterEvent as PreparedEvents,
          deps,
        );

        deps.logger.info({
          description: "Resolved supplier details from config",
          supplierDetails,
        });

        incrementAllocation(
          volumeGroupAllocations,
          supplierDetails?.volumeGroupId ?? "unknown",
          supplierSpec.supplierId,
          1,
          deps,
        );

        supplier = supplierSpec.supplierId;
        priority = String(supplierSpec.priority);

        deps.logger.info({
          description: "Resolved supplier spec",
          supplierSpec,
        });

        // Send to allocated letters queue
        const queueUrl = process.env.UPSERT_LETTERS_QUEUE_URL;
        if (!queueUrl) {
          throw new Error("UPSERT_LETTERS_QUEUE_URL not configured");
        }

        const queueMessage = {
          letterEvent,
          supplierSpec,
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

        incrementMetric(perAllocationSuccess, supplier, priority);
      } catch (error) {
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
