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
import { Unit } from "aws-embedded-metrics";
import {
  IdempotencyConfig,
  makeIdempotent,
} from "@aws-lambda-powertools/idempotency";
import {
  MetricEntry,
  MetricStatus,
  buildEMFObject,
  formatGroupId,
} from "@internal/helpers";
import { Logger } from "pino";
import { Deps } from "../config/deps";
import {
  AllocationDetails,
  PreparedEvents,
  QueueMessage,
  QueueMessageSchema,
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
      handler: async (request, allocationDetails, deps) => {
        const preparedRequest = request as PreparedEvents;
        const letterToInsert: InsertLetter = mapToInsertLetter(
          preparedRequest,
          allocationDetails,
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
    handler: async (request, allocationDetails, deps) => {
      const supplierEvent = request as LetterStatusChangeEvent;
      const letterToUpdate: UpdateLetter = mapToUpdateLetter(supplierEvent);
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
    },
  };
}

function mapToInsertLetter(
  upsertRequest: PreparedEvents,
  allocationDetails: AllocationDetails,
): InsertLetter {
  const now = new Date().toISOString();
  return {
    id: upsertRequest.data.domainId,
    eventId: upsertRequest.id,
    supplierId: allocationDetails.supplierSpec.supplierId,
    status:
      allocationDetails.allocationStatus.status === "REJECTED"
        ? "REJECTED"
        : "PENDING",
    reasonCode: allocationDetails.allocationStatus.reasonCode,
    reasonText: allocationDetails.allocationStatus.reasonText,
    specificationId: allocationDetails.supplierSpec.specId,
    priority: allocationDetails.supplierSpec.priority,
    groupId: formatGroupId(
      upsertRequest.data.clientId,
      upsertRequest.data.campaignId,
      upsertRequest.data.templateId,
    ),
    url: upsertRequest.data.url,
    source: upsertRequest.source,
    subject: upsertRequest.subject,
    createdAt: now,
    updatedAt: now,
    billingRef: allocationDetails.supplierSpec.specId,
    specificationBillingId: allocationDetails.supplierSpec.billingId,
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
  allocationDetails: AllocationDetails,
  deps: Deps,
) {
  for (const schema of operation.schemas) {
    const r = schema.safeParse(letterEvent);
    if (r.success) {
      await operation.handler(r.data, allocationDetails, deps);
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
    Supplier: supplier || "unknown",
    GroupId: groupId || "unknown",
  };

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
        let allocationDetails: AllocationDetails | undefined;

        if ("letterEvent" in queueMessage) {
          letterEvent = queueMessage.letterEvent;
          allocationDetails = queueMessage.allocationDetails;
        } else {
          letterEvent = queueMessage;
          allocationDetails = undefined;
        }

        deps.logger.info({
          description: "Extracted letter event",
          messageId: record.messageId,
          type: letterEvent.type,
          supplier: allocationDetails?.supplierSpec,
        });

        idempotencyConfig.registerLambdaContext(context);
        await processRecordIdempotently(letterEvent, allocationDetails, deps);
      } catch (error) {
        deps.logger.error({
          description: "Error processing upsert of record",
          err: error,
          messageId: record.messageId,
          message: record.body,
        });
        await emitIndividualMetric(
          deps.logger,
          "unknown",
          MetricStatus.Failure,
        );
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(tasks);

    return { batchItemFailures };
  };
}

async function processRecord(
  letterEvent: LetterStatusChangeEvent | PreparedEvents,
  allocationDetails: AllocationDetails | undefined,
  deps: Deps,
) {
  const supplier =
    allocationDetails?.supplierSpec.supplierId ??
    getSupplierIdFromEvent(letterEvent);

  const operation = getOperationFromType(letterEvent.type);

  await runUpsert(
    operation,
    letterEvent,
    allocationDetails ?? {
      supplierSpec: {
        supplierId: "unknown",
        specId: "unknown",
        priority: 10,
        billingId: "unknown",
      },
      allocationStatus: {
        status: "REJECTED",
        reasonCode: "NO_ALLOCATION_DETAILS",
        reasonText: "No allocation details were provided for this event",
      },
    },
    deps,
  );

  return supplier;
}
