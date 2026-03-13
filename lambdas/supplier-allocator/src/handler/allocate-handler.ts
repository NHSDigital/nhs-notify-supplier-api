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
import {
  getSupplierAllocationsForVolumeGroup,
  getSupplierDetails,
  getVariantDetails,
  getVolumeGroupDetails,
} from "../services/supplier-config";
import { Deps } from "../config/deps";

type SupplierSpec = { supplierId: string; specId: string; billingId: string };
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

export default function createSupplierAllocatorHandler(deps: Deps): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    const tasks = event.Records.map(async (record) => {
      try {
        const letterEvent: unknown = JSON.parse(record.body);

        deps.logger.info({
          description: "Extracted letter event",
          messageId: record.messageId,
        });

        validateType(letterEvent);

        const supplierSpec = getSupplier(letterEvent as PreparedEvents, deps);
        await getSupplierFromConfig(letterEvent as PreparedEvents, deps);

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
      } catch (error) {
        deps.logger.error({
          description: "Error processing allocation of record",
          err: error,
          messageId: record.messageId,
          message: record.body,
        });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}
