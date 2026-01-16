import {
  SNSMessage,
  SQSBatchItemFailure,
  SQSEvent,
  SQSHandler,
  SQSRecord,
} from "aws-lambda";
import { InsertLetter, UpdateLetter } from "@internal/datastore";
import {
  $LetterRequestPreparedEvent,
  LetterRequestPreparedEvent,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  $LetterEvent,
  LetterEvent,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";
import {
  $LetterRequestPreparedEventV2,
  LetterRequestPreparedEventV2,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import z from "zod";
import { Deps } from "../config/deps";

type SupplierSpec = { supplierId: string; specId: string };
type PreparedEvents = LetterRequestPreparedEventV2 | LetterRequestPreparedEvent;
type UpsertOperation = {
  name: "Insert" | "Update";
  schemas: z.ZodSchema[];
  handler: (request: unknown, deps: Deps) => Promise<void>;
};

// small envelope that must exist in all inputs
const TypeEnvelope = z.object({ type: z.string().min(1) });

function getOperationFromType(type: string): UpsertOperation {
  if (type.startsWith("uk.nhs.notify.letter-rendering.letter-request.prepared"))
    return {
      name: "Insert",
      schemas: [$LetterRequestPreparedEventV2, $LetterRequestPreparedEvent],
      handler: async (request, deps) => {
        const preparedRequest = request as PreparedEvents;
        const supplierSpec: SupplierSpec = resolveSupplierForVariant(
          preparedRequest.data.letterVariantId,
          deps,
        );
        const letterToInsert: InsertLetter = mapToInsertLetter(
          preparedRequest,
          supplierSpec.supplierId,
          supplierSpec.specId,
          supplierSpec.specId, // use specId for now
        );
        await deps.letterRepo.putLetter(letterToInsert);
      },
    };
  if (type.startsWith("uk.nhs.notify.supplier-api.letter"))
    return {
      name: "Update",
      schemas: [$LetterEvent],
      handler: async (request, deps) => {
        const supplierEvent = request as LetterEvent;
        const letterToUpdate: UpdateLetter = mapToUpdateLetter(supplierEvent);
        await deps.letterRepo.updateLetterStatus(letterToUpdate);
      },
    };
  throw new Error(`Unknown operation from type=${type}`);
}

function mapToInsertLetter(
  upsertRequest: PreparedEvents,
  supplier: string,
  spec: string,
  billingRef: string,
): InsertLetter {
  const now = new Date().toISOString();
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
    subject: upsertRequest.subject,
    createdAt: now,
    updatedAt: now,
    billingRef,
  };
}

function mapToUpdateLetter(upsertRequest: LetterEvent): UpdateLetter {
  return {
    id: upsertRequest.data.domainId,
    supplierId: upsertRequest.data.supplierId,
    status: upsertRequest.data.status,
    reasonCode: upsertRequest.data.reasonCode,
    reasonText: upsertRequest.data.reasonText,
  };
}

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
  const maybeEventBridge = event as any;
  if (maybeEventBridge.source && maybeEventBridge.detail) {
    return maybeEventBridge.detail;
  }
  return event;
}

function getType(event: unknown) {
  const env = TypeEnvelope.safeParse(event);
  if (!env.success) {
    throw new Error("Missing or invalid envelope.type field");
  }
  return env.data.type;
}

async function runUpsert(
  operation: UpsertOperation,
  letterEvent: unknown,
  deps: Deps,
) {
  for (const schema of operation.schemas) {
    const r = schema.safeParse(letterEvent);
    if (r.success) {
      await operation.handler(r.data, deps);
      return;
    }
  }
  // none matched
  throw new Error("No matching schema for received message");
}

export default function createUpsertLetterHandler(deps: Deps): SQSHandler {
  return async (event: SQSEvent) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    const tasks = event.Records.map(async (record) => {
      try {
        const message: string = parseSNSNotification(record);

        const event = JSON.parse(message);

        const letterEvent: unknown = removeEventBridgeWrapper(event);

        const type = getType(letterEvent);

        const operation = getOperationFromType(type);

        await runUpsert(operation, letterEvent, deps);
      } catch (error) {
        deps.logger.error(
          { err: error, message: record.body },
          `Error processing upsert of record ${record.messageId}`,
        );
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}
