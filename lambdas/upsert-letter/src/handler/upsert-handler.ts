import { SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
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
import { MetricsLogger, Unit, metricScope } from "aws-embedded-metrics";
import { Deps } from "../config/deps";

type SupplierSpec = { supplierId: string; specId: string };
type PreparedEvents = LetterRequestPreparedEventV2 | LetterRequestPreparedEvent;

const SupplierSpecSchema = z.object({
  supplierId: z.string().min(1),
  specId: z.string().min(1),
});

const PreparedEventUnionSchema = z.discriminatedUnion("type", [
  $LetterRequestPreparedEventV2,
  $LetterRequestPreparedEvent,
]);

const QueueMessageSchema = z.union([
  $LetterEvent,
  z.object({
    letterEvent: PreparedEventUnionSchema,
    supplierSpec: SupplierSpecSchema,
  }),
]);

type QueueMessage = z.infer<typeof QueueMessageSchema>;

type UpsertOperation = {
  name: "Insert" | "Update";
  schemas: z.ZodSchema[];
  handler: (
    request: unknown,
    supplierSpec: SupplierSpec,
    deps: Deps,
  ) => Promise<void>;
};

function getOperationFromType(type: string): UpsertOperation {
  if (
    type.startsWith("uk.nhs.notify.letter-rendering.letter-request.prepared")
  ) {
    return {
      name: "Insert",
      schemas: [$LetterRequestPreparedEventV2, $LetterRequestPreparedEvent],
      handler: async (request, supplierSpec, deps) => {
        const preparedRequest = request as PreparedEvents;
        const letterToInsert: InsertLetter = mapToInsertLetter(
          preparedRequest,
          supplierSpec.supplierId,
          supplierSpec.specId,
          supplierSpec.specId, // use specId for now
        );
        await deps.letterRepo.putLetter(letterToInsert);

        deps.logger.info({
          description: "Inserted letter",
          eventId: preparedRequest.id,
          letterId: letterToInsert.id,
          supplierId: letterToInsert.supplierId,
        });
      },
    };
  }
  // if it's not an insert type, it must be an update as we've already parsed the message, but we want to have a separate operation for better logging and metrics
  return {
    name: "Update",
    schemas: [$LetterEvent],
    handler: async (request, supplierSpec, deps) => {
      const supplierEvent = request as LetterEvent;
      const letterToUpdate: UpdateLetter = mapToUpdateLetter(supplierEvent);
      await deps.letterRepo.updateLetterStatus(letterToUpdate);

      deps.logger.info({
        description: "Updated letter",
        eventId: supplierEvent.id,
        letterId: letterToUpdate.id,
        supplierId: letterToUpdate.supplierId,
      });
    },
  };
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
    eventId: upsertRequest.id,
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
    eventId: upsertRequest.id,
    supplierId: upsertRequest.data.supplierId,
    status: upsertRequest.data.status,
    reasonCode: upsertRequest.data.reasonCode,
    reasonText: upsertRequest.data.reasonText,
  };
}

async function runUpsert(
  operation: UpsertOperation,
  letterEvent: unknown,
  supplierSpec: SupplierSpec,
  deps: Deps,
) {
  for (const schema of operation.schemas) {
    const r = schema.safeParse(letterEvent);
    if (r.success) {
      await operation.handler(r.data, supplierSpec, deps);
      return;
    }
  }
}

async function emitMetrics(
  metrics: MetricsLogger,
  successMetrics: Map<string, number>,
  failedMetrics: Map<string, number>,
) {
  metrics.setNamespace(process.env.AWS_LAMBDA_FUNCTION_NAME || `upsertLetter`);
  // emit success metrics
  for (const [supplier, count] of successMetrics) {
    metrics.putDimensions({
      Supplier: supplier,
    });
    metrics.putMetric("MessagesProcessed", count, Unit.Count);
  }
  // emit failure metrics
  for (const [supplier, count] of failedMetrics) {
    metrics.putDimensions({
      Supplier: supplier,
    });
    metrics.putMetric("MessageFailed", count, Unit.Count);
  }
}

function getSupplierIdFromEvent(letterEvent: any): string {
  if (letterEvent && letterEvent.data && letterEvent.data.supplierId) {
    return letterEvent.data.supplierId;
  }
  return "unknown";
}

function parseQueueMessage(queueMessage: string): QueueMessage {
  const result = QueueMessageSchema.safeParse(queueMessage);

  if (!result.success) {
    throw new Error(
      `Message did not match an expected schema: ${JSON.stringify(
        result.error.issues,
      )}`,
    );
  }
  return result.data;
}

export default function createUpsertLetterHandler(deps: Deps): SQSHandler {
  return metricScope((metrics: MetricsLogger) => {
    return async (event: SQSEvent) => {
      const batchItemFailures: SQSBatchItemFailure[] = [];
      const perSupplierSuccess: Map<string, number> = new Map<string, number>();
      const perSupplierFailure: Map<string, number> = new Map<string, number>();

      const tasks = event.Records.map(async (record) => {
        let supplier = "unknown";
        try {
          deps.logger.info({
            description: "Processing record",
            messageId: record.messageId,
            message: record.body,
          });
          const sqsMessage = JSON.parse(record.body);

          const queueMessage: QueueMessage = parseQueueMessage(sqsMessage);

          let letterEvent: LetterEvent | PreparedEvents;
          let supplierSpec: SupplierSpec | undefined;

          if ("letterEvent" in queueMessage) {
            letterEvent = queueMessage.letterEvent;
            supplierSpec = queueMessage.supplierSpec;
          } else {
            letterEvent = queueMessage;
            supplierSpec = undefined;
          }

          deps.logger.info({
            description: "Extracted letter event",
            messageId: record.messageId,
            type: letterEvent.type,
            supplier: supplierSpec,
          });

          supplier =
            !supplierSpec || !supplierSpec.supplierId
              ? getSupplierIdFromEvent(letterEvent)
              : supplierSpec.supplierId;

          const operation = getOperationFromType(letterEvent.type);

          await runUpsert(
            operation,
            letterEvent,
            supplierSpec ?? { supplierId: "unknown", specId: "unknown" },
            deps,
          );

          perSupplierSuccess.set(
            supplier,
            (perSupplierSuccess.get(supplier) || 0) + 1,
          );
        } catch (error) {
          deps.logger.error({
            description: "Error processing upsert of record",
            err: error,
            messageId: record.messageId,
            message: record.body,
          });
          perSupplierFailure.set(
            supplier,
            (perSupplierFailure.get(supplier) || 0) + 1,
          );
          batchItemFailures.push({ itemIdentifier: record.messageId });
        }
      });

      await Promise.all(tasks);

      await emitMetrics(metrics, perSupplierSuccess, perSupplierFailure);
      return { batchItemFailures };
    };
  });
}
