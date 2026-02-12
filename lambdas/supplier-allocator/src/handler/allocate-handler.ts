import {
  SNSMessage,
  SQSBatchItemFailure,
  SQSEvent,
  SQSHandler,
  SQSRecord,
} from "aws-lambda";
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
  return deps.env.VARIANT_MAP[variantId];
}

function parseSNSNotification(record: SQSRecord) {
  const notification = JSON.parse(record.body) as Partial<SNSMessage>;
  if (
    notification.Type !== "Notification" ||
    typeof notification.Message !== "string"
  ) {
    throw new Error(
      "SQS record does not contain SNS Notification with string Message",
    );
  }
  return notification.Message;
}

function removeEventBridgeWrapper(event: any) {
  const maybeEventBridge = event;
  if (maybeEventBridge.source && maybeEventBridge.detail) {
    return maybeEventBridge.detail;
  }
  return event;
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
        const message: string = parseSNSNotification(record);

        const snsEvent = JSON.parse(message);

        const letterEvent: unknown = removeEventBridgeWrapper(snsEvent);

        deps.logger.info({
          description: "Extracted letter event",
          messageId: record.messageId,
        });

        validateType(letterEvent);

        const supplierSpec = getSupplier(letterEvent as PreparedEvents, deps);

        // Send to allocated letters queue
        const queueUrl = process.env.ALLOCATED_LETTERS_QUEUE_URL;
        if (!queueUrl) {
          throw new Error("ALLOCATED_LETTERS_QUEUE_URL not configured");
        }

        const queueMessage = {
          letterEvent,
          supplierSpec,
        };

        deps.logger.info(
          { msg: queueMessage, url: queueUrl },
          "Sending message to allocated letters queue",
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
