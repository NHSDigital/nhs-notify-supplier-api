import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  LetterVariant,
  Supplier,
  SupplierAllocation,
  VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import z from "zod";
import { Unit } from "aws-embedded-metrics";
import { MetricEntry, MetricStatus, buildEMFObject } from "@internal/helpers";
import {
  getSupplierAllocationsForVolumeGroup,
  getSupplierDetails,
  getVariantDetails,
  getVolumeGroupDetails,
} from "../services/supplier-config";
import { Deps } from "../config/deps";

type SupplierSpec = {
  supplierId: string;
  specId: string;
  priority: number;
  billingId: string;
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

async function getSupplierFromConfig(letterEvent: PreparedEvents, deps: Deps) {
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

    const supplierDetails: Supplier[] = await getSupplierDetails(
      supplierAllocations,
      deps,
    );
    deps.logger.info({
      description: "Fetched supplier details for supplier allocations",
      variantId: letterEvent.data.letterVariantId,
      volumeGroupId: volumeGroupDetails.id,
      supplierAllocationIds: supplierAllocations.map((a) => a.id),
      supplierDetails,
    });

    return supplierDetails;
  } catch (error) {
    deps.logger.error({
      description: "Error fetching supplier from config",
      err: error,
      variantId: letterEvent.data.letterVariantId,
    });
    return [];
  }
}

function getSupplier(letterEvent: PreparedEvents, deps: Deps): SupplierSpec {
  return resolveSupplierForVariant(letterEvent.data.letterVariantId, deps);
}

type AllocationMetrics = Map<string, Map<string, number>>;

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

function emitSupCampaignClientMetric(
  letterEvent: PreparedEvents,
  supplier: string,
  status: string,
  deps: Deps,
) {
  const namespace = "supplier-allocator";
  const { campaignId, clientId } = letterEvent.data;
  console.log("VLASIS and the campaignId is:", campaignId);
  const dimensions: Record<string, string> = {
    Supplier: supplier,
    ClientId: clientId,
    CampaignId: campaignId || "unknown",
  };
  const metric: MetricEntry = {
    key: status,
    value: 1,
    unit: Unit.Count,
  };
  deps.logger.info(buildEMFObject(namespace, dimensions, metric));
}

export default function createSupplierAllocatorHandler(deps: Deps): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];
    const perAllocationSuccess: AllocationMetrics = new Map();
    const perAllocationFailure: AllocationMetrics = new Map();

    const tasks = event.Records.map(async (record) => {
      let supplier = "unknown";
      let priority = "unknown";
      let letterEvent: PreparedEvents | undefined;
      try {
        letterEvent = JSON.parse(record.body) as PreparedEvents;

        deps.logger.info({
          description: "Extracted letter event",
          messageId: record.messageId,
        });

        validateType(letterEvent);

        const supplierSpec = getSupplier(letterEvent, deps);
        await getSupplierFromConfig(letterEvent, deps);

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
        // increment clientid
        // increment campaignid
        // emit metric with current supplier, clientId and campaignId
        emitSupCampaignClientMetric(
          letterEvent,
          supplier,
          "supplier_Campaign_Client",
          deps,
        );
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
    return { batchItemFailures };
  };
}
