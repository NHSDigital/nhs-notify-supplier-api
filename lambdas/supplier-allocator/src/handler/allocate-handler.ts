import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";

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
  deps.logger.info({ variantId }, "Resolving supplier for letter variant");
  return deps.env.VARIANT_MAP[variantId];
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

        deps.logger.info(
          { msg: queueMessage, url: queueUrl },
          "Sending message to upsert letter queue",
        );

        await deps.sqsClient.send(
          new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(queueMessage),
          }),
        );
      } catch (error) {
        deps.logger.error(
          { err: error, message: record.body },
          `Error processing allocation of record ${record.messageId}`,
        );
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}
