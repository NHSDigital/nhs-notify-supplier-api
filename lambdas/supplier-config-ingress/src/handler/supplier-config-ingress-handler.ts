import type { SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { z } from "zod/v4";
import { Unit } from "aws-embedded-metrics";
import {
  $SupplierConfigEntity,
  SupplierConfigEntity,
  SupplierConfigRepository,
} from "@internal/datastore";
import {
  $LetterVariant,
  $PackSpecification,
  $Supplier,
  $SupplierAllocation,
  $SupplierPack,
  $VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";
import { MetricEntry, MetricStatus, buildEMFObject } from "@internal/helpers";
import { Deps } from "../config/deps";

const $EventEnvelope = z.object({
  type: z.string(),
  data: z.looseObject({ id: z.string() }),
});

type IdSchema = {
  parse: (input: unknown) => { id: string };
};

const entitySchemas: Record<SupplierConfigEntity, IdSchema> = {
  "letter-variant": $LetterVariant,
  "volume-group": $VolumeGroup,
  "supplier-allocation": $SupplierAllocation,
  supplier: $Supplier,
  "pack-specification": $PackSpecification,
  "supplier-pack": $SupplierPack,
};

type UpsertResult = Awaited<
  ReturnType<SupplierConfigRepository["upsertSupplierConfig"]>
>;

function extractEntityFromType(type: string) {
  const elements = type.split(".");
  return $SupplierConfigEntity.parse(
    elements.length > 4 ? elements[4] : undefined,
  );
}

function parseSupplierConfigFromRecord(record: SQSRecord): {
  entity: SupplierConfigEntity;
  config: { id: string };
} {
  const event = $EventEnvelope.parse(JSON.parse(record.body));

  const entity = extractEntityFromType(event.type);
  const config = entitySchemas[entity].parse(event.data);

  return { entity, config };
}

function emitSuccessMetric(
  logger: Deps["logger"],
  entity: string,
  result: UpsertResult,
) {
  const namespace = "supplier-config-ingress";
  const dimensions: Record<string, string> = { entity, result };
  const metric: MetricEntry = {
    key: MetricStatus.Success,
    value: 1,
    unit: Unit.Count,
  };
  logger.info(buildEMFObject(namespace, dimensions, metric));
}

function emitFailureMetric(logger: Deps["logger"], entity: string) {
  const namespace = "supplier-config-ingress";
  const dimensions: Record<string, string> = { entity };
  const metric: MetricEntry = {
    key: MetricStatus.Failure,
    value: 1,
    unit: Unit.Count,
  };
  logger.info(buildEMFObject(namespace, dimensions, metric));
}

export default function createSupplierConfigIngressHandler(deps: Deps) {
  const { logger, supplierConfigRepo } = deps;

  return async (sqsEvent: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: { itemIdentifier: string }[] = [];
    const failedEntities: string[] = [];

    for (const record of sqsEvent.Records) {
      let entity: string | undefined;
      try {
        logger.info(
          { messageId: record.messageId, body: record.body },
          "Processing record",
        );
        const parsed = parseSupplierConfigFromRecord(record);
        entity = parsed.entity;

        logger.info(
          { entity, id: parsed.config.id },
          "Processing supplier config upsert",
        );

        const result = await supplierConfigRepo.upsertSupplierConfig(
          parsed.entity,
          parsed.config,
        );

        emitSuccessMetric(logger, parsed.entity, result);

        logger.info(
          { entity, pk: parsed.config.id, result },
          "Supplier config upserted",
        );
      } catch (error) {
        logger.error(
          { error, messageId: record.messageId },
          "Failed to process supplier config record",
        );
        batchItemFailures.push({ itemIdentifier: record.messageId });
        failedEntities.push(entity ?? "unknown");
      }
    }

    for (const entity of failedEntities) {
      emitFailureMetric(logger, entity);
    }

    return { batchItemFailures };
  };
}
