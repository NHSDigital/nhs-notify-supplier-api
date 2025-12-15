import {
  SNSMessage,
  SQSBatchItemFailure,
  SQSEvent,
  SQSHandler,
} from "aws-lambda";
import { UpsertLetter } from "@internal/datastore";
import {
  $LetterRequestPreparedEvent,
  LetterRequestPreparedEvent,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  $LetterRequestPreparedEventV2,
  LetterRequestPreparedEventV2,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { ZodError } from "zod";
import { Deps } from "../config/deps";

type SupplierSpec = { supplierId: string; specId: string };

function mapToUpsertLetter(
  upsertRequest: LetterRequestPreparedEventV2 | LetterRequestPreparedEvent,
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

function parseLetterRequestPreparedEvent(
  message: string,
  deps: Deps,
): LetterRequestPreparedEvent | LetterRequestPreparedEventV2 {
  const parsedMessage = JSON.parse(message);

  try {
    const upsertRequest: LetterRequestPreparedEventV2 =
      $LetterRequestPreparedEventV2.parse(parsedMessage);
    return upsertRequest;
  } catch (error) {
    deps.logger.info(
      { err: error, message },
      "Trying to parse message with V1 schema",
    );
    const upsertRequest: LetterRequestPreparedEvent =
      $LetterRequestPreparedEvent.parse(parsedMessage);
    return upsertRequest;
  }
}

export default function createUpsertLetterHandler(deps: Deps): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    const tasks = event.Records.map(async (record) => {
      try {
        const notification = JSON.parse(record.body) as Partial<SNSMessage>;
        if (
          notification.Type !== "Notification" ||
          typeof notification.Message !== "string"
        ) {
          throw new Error(
            "SQS record does not contain SNS Notification with string Message",
          );
        }

        const upsertRequest:
          | LetterRequestPreparedEvent
          | LetterRequestPreparedEventV2 = parseLetterRequestPreparedEvent(
          notification.Message,
          deps,
        );

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
            { issues: error.issues, body: record.body },
            "Error parsing letter event in upsert",
          );
        } else {
          deps.logger.error({ err: error }, "Error processing upsert");
        }
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}
