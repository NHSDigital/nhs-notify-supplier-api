import { Context, SQSBatchItemFailure, SQSEvent, SQSHandler } from "aws-lambda";
import { $LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  InsertLetter,
  LetterAlreadyExistsError,
  UpdateLetter,
} from "@internal/datastore";
import {
  $LetterStatusChangeEvent,
  LetterStatusChangeEvent,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";
import { $LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { MetricsLogger, Unit, metricScope } from "aws-embedded-metrics";
import {
  IdempotencyConfig,
  makeIdempotent,
} from "@aws-lambda-powertools/idempotency";
import { MetricEntry, MetricStatus, buildEMFObject } from "@internal/helpers";
import { Logger } from "pino";
import { Deps } from "../config/deps";
import {
  PreparedEvents,
  QueueMessage,
  QueueMessageSchema,
  SupplierSpec,
  UpsertOperation,
} from "./schemas";

const idempotencyConfig = new IdempotencyConfig({
  eventKeyJmesPath: "id",
});

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
          supplierSpec.priority,
          supplierSpec.billingId, // use billingId for now
        );
        try {
          await deps.letterRepo.putLetter(letterToInsert);

          deps.logger.info({
            description: "Inserted letter",
            eventId: preparedRequest.id,
            letterId: letterToInsert.id,
            supplierId: letterToInsert.supplierId,
          });
          // emit success metric
          emitIndividualMetric(
            deps.logger,
            letterToInsert.supplierId,
            MetricStatus.Success,
            letterToInsert.groupId,
          );
        } catch (error) {
          // emit failure metric
          emitIndividualMetric(
            deps.logger,
            letterToInsert.supplierId,
            MetricStatus.Failure,
            letterToInsert.groupId,
          );
          if (error instanceof LetterAlreadyExistsError) {
            deps.logger.warn({
              description: "Letter already exists",
              supplierId: letterToInsert.supplierId,
              letterId: letterToInsert.id,
            });
          } else {
            throw error;
          }
        }
      },
    };
  }
  // if it's not an insert type, it must be an update as we've already parsed the message, but we want to have a separate operation for better logging and metrics
  return {
    name: "Update",
    schemas: [$LetterStatusChangeEvent],
    handler: async (request, supplierSpec, deps) => {
      const supplierEvent = request as LetterStatusChangeEvent;
      const letterToUpdate: UpdateLetter = mapToUpdateLetter(supplierEvent);
      try {
        await deps.letterRepo.updateLetterStatus(letterToUpdate);

        deps.logger.info({
          description: "Updated letter",
          eventId: supplierEvent.id,
          letterId: letterToUpdate.id,
          supplierId: letterToUpdate.supplierId,
        });
        emitIndividualMetric(
          deps.logger,
          letterToUpdate.supplierId,
          MetricStatus.Success,
        );
      } catch (error) {
        emitIndividualMetric(
          deps.logger,
          letterToUpdate.supplierId,
          MetricStatus.Failure,
        );
        if (error instanceof LetterAlreadyExistsError) {
          deps.logger.warn({
            description: "Letter already exists",
            supplierId: letterToUpdate.supplierId,
            letterId: letterToUpdate.id,
          });
        } else {
          throw error;
        }
      }
    },
  };
}

/**
 * NOTE: `groupId` needs to match the groupId in the function {@link allocate-handler#emitDataMetrics}
 * so the value always needs to be updated in both places
 */
function mapToInsertLetter(
  upsertRequest: PreparedEvents,
  supplier: string,
  spec: string,
  billingRef: string,
  priority: number,
  billingId: string,
): InsertLetter {
  const now = new Date().toISOString();
  return {
    id: upsertRequest.data.domainId,
    eventId: upsertRequest.id,
    supplierId: supplier,
    status: "PENDING",
    specificationId: spec,
    priority,
    groupId: `${upsertRequest.data.clientId}_${upsertRequest.data.campaignId}_${upsertRequest.data.templateId}`,
    url: upsertRequest.data.url,
    source: upsertRequest.source,
    subject: upsertRequest.subject,
    createdAt: now,
    updatedAt: now,
    billingRef,
    specificationBillingId: billingId,
  };
}

function mapToUpdateLetter(
  upsertRequest: LetterStatusChangeEvent,
): UpdateLetter {
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

async function emitIndividualMetric(
  logger: Logger,
  supplier: string,
  metricKey: MetricStatus,
  groupId?: string,
) {
  const namespace = process.env.AWS_LAMBDA_FUNCTION_NAME || "upsertLetter";
  const dimensions: Record<string, string> = {
    Supplier: supplier,
  };
  if (groupId) {
    dimensions.GroupId = groupId;
  }

  const metric: MetricEntry = {
    key: metricKey,
    value: 1,
    unit: Unit.Count,
  };
  logger.info(buildEMFObject(namespace, dimensions, metric));
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
  const processRecordIdempotently = makeIdempotent(processRecord, {
    persistenceStore: deps.idempotencyLayer,
    config: idempotencyConfig,
  });

  return async (event: SQSEvent, context: Context) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    const tasks = event.Records.map(async (record) => {
      try {
        deps.logger.info({
          description: "Processing record",
          messageId: record.messageId,
          message: record.body,
        });
        const sqsMessage = JSON.parse(record.body);

        const queueMessage: QueueMessage = parseQueueMessage(sqsMessage);

        let letterEvent: LetterStatusChangeEvent | PreparedEvents;
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

        idempotencyConfig.registerLambdaContext(context);
        await processRecordIdempotently(letterEvent, supplierSpec, deps);
      } catch (error) {
        deps.logger.error({
          description: "Error processing upsert of record",
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

async function processRecord(
  letterEvent: LetterStatusChangeEvent | PreparedEvents,
  supplierSpec: SupplierSpec | undefined,
  deps: Deps,
) {
  const supplier =
    !supplierSpec || !supplierSpec.supplierId
      ? getSupplierIdFromEvent(letterEvent)
      : supplierSpec.supplierId;

  const operation = getOperationFromType(letterEvent.type);

  await runUpsert(
    operation,
    letterEvent,
    supplierSpec ?? {
      supplierId: "unknown",
      specId: "unknown",
      priority: 10,
      billingId: "unknown",
    },
    deps,
  );

  return supplier;
}
