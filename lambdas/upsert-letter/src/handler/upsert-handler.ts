import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { UpsertLetter } from "@internal/datastore";
import {
  $LetterRequestPreparedEvent,
  LetterRequestPreparedEvent,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { ZodError } from "zod";
import { Deps } from "../config/deps";

type SupplierSpec = { supplierId: string; specId: string };

function mapToUpsertLetter(
  upsertRequest: LetterRequestPreparedEvent,
  supplier: string,
  spec: string,
): UpsertLetter {
  return {
    id: upsertRequest.data.domainId,
    supplierId: supplier,
    status: "PENDING",
    specificationId: spec,
    groupId:
      upsertRequest.data.clientId +
      upsertRequest.data.campaignId +
      upsertRequest.data.templateId,
    url: upsertRequest.data.url,
    source: upsertRequest.source,
  };
}

function resolveSupplierForVariant(
  variantId: string,
  deps: Deps,
): SupplierSpec {
  return deps.env.VARIANT_MAP[variantId];
}

export default function createUpsertLetterHandler(deps: Deps): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    const tasks = event.Records.map(async (record) => {
      try {
        const upsertRequest: LetterRequestPreparedEvent =
          $LetterRequestPreparedEvent.parse(JSON.parse(record.body));

        const supplierSpec: SupplierSpec = resolveSupplierForVariant(
          upsertRequest.data.letterVariantId,
          deps,
        );
        const letterToUpsert: UpsertLetter = mapToUpsertLetter(
          upsertRequest,
          supplierSpec.supplierId,
          supplierSpec.specId,
        );

        await deps.letterRepo.upsertLetter(letterToUpsert);
      } catch (error) {
        if (error instanceof ZodError) {
          deps.logger.error(
            { issues: error.issues },
            "Error parsing letter event in upsert",
          );
        }
        deps.logger.error({ err: error }, "Error processing upsert");
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}
