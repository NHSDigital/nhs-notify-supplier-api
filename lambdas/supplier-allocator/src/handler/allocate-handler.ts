import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  LetterVariant,
  PackSpecification,
  Supplier,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import z from "zod";
import { Unit } from "aws-embedded-metrics";
import { MetricEntry, MetricStatus, buildEMFObject } from "@internal/helpers";
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
import { PreparedEvents, SupplierDetails, SupplierSpec } from "./types";

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
    const letterVariant: LetterVariant = await getVariantDetails(
      letterEvent.data.letterVariantId,
      deps,
    );

    const volumeGroup: VolumeGroup = await getVolumeGroupDetails(
      letterVariant.volumeGroupId,
      deps,
    );

    const { supplierAllocations, suppliers: allocatedSuppliers } =
      await eligibleSuppliers(volumeGroup, deps);

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

    const suppliersForPackWithCapacity: Supplier[] =
      await filterSuppliersWithCapacity(
        allSuppliersForPack,
        volumeGroup.id,
        deps,
      );

    // selected supplier id is determined by first calling selectSupplierByFactor for suppliers with capacity and if nothing is returned tryong again with all suppliers for pack
    const selectedSupplierId =
      (await selectSupplierByFactor(
        suppliersForPackWithCapacity,
        supplierAllocations,
        deps,
      )) ??
      (await selectSupplierByFactor(
        allSuppliersForPack,
        supplierAllocations,
        deps,
      ));

    deps.logger.info({
      description: "Fetched supplier details for supplier allocations",
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

    const supplierDetails: SupplierDetails = {
      supplierSpec: {
        supplierId: selectedSupplierId,
        specId: preferredPack.id,
        priority: letterVariant.priority,
        billingId: preferredPack.billingId,
      },
      volumeGroupId: volumeGroup.id,
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
          supplierDetails?.supplierSpec?.supplierId ?? "unknown",
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
