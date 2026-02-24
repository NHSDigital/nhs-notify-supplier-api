import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  LetterVariant,
  SupplierAllocation,
  VolumeGroup,
} from "internal/datastore/src/SupplierConfigDomain";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import z from "zod";
import { Deps } from "../config/deps";

type SupplierSpec = { supplierId: string; specId: string };
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

async function getVariantDetails(
  variantId: string,
  deps: Deps,
): Promise<LetterVariant> {
  deps.logger.info({
    description: "Fetching letter variant details from database",
    variantId,
  });

  const variantDetails: LetterVariant =
    await deps.supplierConfigRepo.getLetterVariant(variantId);

  if (variantDetails) {
    deps.logger.info({
      description: "Fetched letter variant details",
      variantId,
      variantDetails,
    });
  } else {
    deps.logger.error({
      description: "No letter variant found for id",
      variantId,
    });
  }
  return variantDetails;
}

async function getVolumeGroupDetails(
  groupId: string,
  deps: Deps,
): Promise<VolumeGroup> {
  deps.logger.info({
    description: "Fetching volume group details from database",
    groupId,
  });

  const groupDetails = await deps.supplierConfigRepo.getVolumeGroup(groupId);
  if (groupDetails) {
    deps.logger.info({
      description: "Fetched volume group details",
      groupId,
      groupDetails,
    });
  } else {
    deps.logger.error({
      description: "No volume group found for id",
      groupId,
    });
  }

  if (
    groupDetails.status !== "PROD" &&
    (new Date(groupDetails.startDate) > new Date() ||
      (groupDetails.endDate && new Date(groupDetails.endDate) < new Date()))
  ) {
    deps.logger.error({
      description: "Volume group is not active based on status and dates",
      groupId,
      status: groupDetails.status,
      startDate: groupDetails.startDate,
      endDate: groupDetails.endDate,
    });
    throw new Error(`Volume group with id ${groupId} is not active`);
  }
  return groupDetails;
}

async function getSupplierAllocationsForVolumeGroup(
  groupId: string,
  supplierId: string,
  deps: Deps,
): Promise<SupplierAllocation[]> {
  deps.logger.info({
    description: "Fetching supplier allocations for volume group from database",
    groupId,
  });
  const allocations =
    await deps.supplierConfigRepo.getSupplierAllocationsForVolumeGroup(groupId);

  if (allocations.length > 0) {
    deps.logger.info({
      description:
        "Fetched supplier allocations for volume group from database",
      groupId,
      count: allocations.length,
    });
  } else {
    deps.logger.error({
      description: "No supplier allocations found for volume group id",
      groupId,
    });
  }

  if (supplierId) {
    const filteredAllocations = allocations.filter(
      (alloc) => alloc.supplier === supplierId,
    );
    if (filteredAllocations.length === 0) {
      deps.logger.error({
        description:
          "No supplier allocations found for variantsupplier id in volume group",
        groupId,
        supplierId,
      });
      throw new Error(
        `No supplier allocations found for variant supplier id ${supplierId} in volume group ${groupId}`,
      );
    }
    return filteredAllocations;
  }

  return allocations;
}

async function getSupplierFromConfig(letterEvent: PreparedEvents, deps: Deps) {
  const variantDetails: LetterVariant = await getVariantDetails(
    letterEvent.data.letterVariantId,
    deps,
  );
  deps.logger.info({
    description: "Fetched variant details for letter variant",
    variantDetails,
  });

  const volumeGroupDetails: VolumeGroup = await getVolumeGroupDetails(
    variantDetails.volumeGroupId,
    deps,
  );
  deps.logger.info({
    description: "Fetched volume group details for letter variant",
    volumeGroupDetails,
  });

  const supplierAllocations: SupplierAllocation[] =
    await getSupplierAllocationsForVolumeGroup(
      variantDetails.volumeGroupId,
      variantDetails.supplierId ?? "",
      deps,
    );
  deps.logger.info({
    description: "Fetched supplier allocations for volume group",
    supplierAllocations,
  });
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

        await getSupplierFromConfig(letterEvent as PreparedEvents, deps);

        const supplierSpec = getSupplier(letterEvent as PreparedEvents, deps);

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
