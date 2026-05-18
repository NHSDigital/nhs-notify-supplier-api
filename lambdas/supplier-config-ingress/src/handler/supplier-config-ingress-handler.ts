import type { SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { z } from "zod/v4";
import {
  $SupplierConfigEntity,
  SupplierConfigEntity,
} from "@internal/datastore";
import {
  $LetterVariant,
  $PackSpecification,
  $Supplier,
  $SupplierAllocation,
  $SupplierPack,
  $VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { Deps } from "../config/deps";

const $SnsNotification = z.looseObject({
  Message: z.string(),
});

const $EventEnvelope = z.looseObject({
  type: z.string(),
  data: z.looseObject({ id: z.string() }),
});

const entitySchemas: Record<SupplierConfigEntity, z.ZodType<{ id: string }>> = {
  "letter-variant": $LetterVariant as unknown as z.ZodType<{ id: string }>,
  "volume-group": $VolumeGroup as unknown as z.ZodType<{ id: string }>,
  "supplier-allocation": $SupplierAllocation as unknown as z.ZodType<{
    id: string;
  }>,
  supplier: $Supplier as unknown as z.ZodType<{ id: string }>,
  "pack-specification": $PackSpecification as unknown as z.ZodType<{
    id: string;
  }>,
  "supplier-pack": $SupplierPack as unknown as z.ZodType<{ id: string }>,
};

function parseSupplierConfigFromRecord(record: SQSRecord): {
  entity: SupplierConfigEntity;
  config: { id: string };
} {
  const snsNotification = $SnsNotification.parse(JSON.parse(record.body));
  const event = $EventEnvelope.parse(JSON.parse(snsNotification.Message));

  const entity = $SupplierConfigEntity.parse(event.type.split(".").pop());
  const config = entitySchemas[entity].parse(event.data);

  return { entity, config };
}

export default function createSupplierConfigIngressHandler(deps: Deps) {
  const { logger, supplierConfigRepo } = deps;

  return async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: { itemIdentifier: string }[] = [];

    for (const record of event.Records) {
      try {
        const { config, entity } = parseSupplierConfigFromRecord(record);

        logger.info(
          { entity, id: config.id },
          "Processing supplier config upsert",
        );

        const result = await supplierConfigRepo.upsertSupplierConfig(
          entity,
          config,
        );

        logger.info(
          { entity, pk: config.id, result },
          "Supplier config upserted",
        );
      } catch (error) {
        logger.error(
          { error, messageId: record.messageId },
          "Failed to process supplier config record",
        );
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    return { batchItemFailures };
  };
}
