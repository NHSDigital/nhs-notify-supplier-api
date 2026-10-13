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

interface UpsertDimensions extends Record<string, string> {
  Supplier: string;
  Status: string;
  ClientId: string;
  CampaignId: string;
  GroupId: string;
  TemplateId: string;
}

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
        const { campaignId, clientId, templateId } = preparedRequest.data;
        const dimensions: UpsertDimensions = {
          ClientId: clientId || "unknown",
          CampaignId: campaignId || "unknown",
          TemplateId: templateId || "unknown",
          Supplier: letterToInsert.supplierId,
          GroupId: letterToInsert.groupId,
          Status: letterToInsert.status,
        };
        try {
          await deps.letterRepo.putLetter(letterToInsert);

          deps.logger.info({
            description: "Inserted letter",
            eventId: preparedRequest.id,
            letterId: letterToInsert.id,
            supplierId: letterToInsert.supplierId,
            letterInsertRequest: request,
            letterToInsert,
          });
          // emit success metric
          emitIndividualMetric(deps.logger, MetricStatus.Success, dimensions);
        } catch (error) {
          if (error instanceof LetterAlreadyExistsError) {
            deps.logger.warn({
              description: "Letter already exists",
              supplierId: letterToInsert.supplierId,
              letterId: letterToInsert.id,
            });
            emitIndividualMetric(deps.logger, MetricStatus.Failure, dimensions);
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
      const groupId = supplierEvent.data?.groupId || "unknown";
      const [clientId, campaignId, templateId] = groupId.split("-");
      const letterToUpdate: UpdateLetter = mapToUpdateLetter(supplierEvent);
      const dimensions: UpsertDimensions = {
        Supplier: letterToUpdate.supplierId || "unknown",
        Status: letterToUpdate.status,
        ClientId: clientId || "unknown",
        CampaignId: campaignId || "unknown",
        GroupId: groupId,
        TemplateId: templateId || "unknown",
      };
      await deps.letterRepo.updateLetterStatus(letterToUpdate);

      deps.logger.info({
        description: "Updated letter",
        eventId: supplierEvent.id,
        letterId: letterToUpdate.id,
        supplierId: letterToUpdate.supplierId,
        letterUpdateRequest: request,
        letterToUpdate,
      });
      emitIndividualMetric(deps.logger, MetricStatus.Success, dimensions);
    },
  };
}

export function extractDimensionsFromLetterEvent(
  letterEvent: LetterStatusChangeEvent | PreparedEvents,
  allocationDetails: AllocationDetails | undefined,
): UpsertDimensions {
  const { type } = letterEvent;
  // Insert type
  if (
    type.startsWith("uk.nhs.notify.letter-rendering.letter-request.prepared")
  ) {
    const preparedRequest = letterEvent as PreparedEvents;
    const { campaignId, clientId, status, templateId } = preparedRequest.data;
    const supplierId = allocationDetails?.supplierSpec.supplierId;
    const groupId = formatGroupId(clientId, campaignId, templateId);
    return {
      Supplier: supplierId || "unknown",
      Status: status,
      ClientId: clientId || "unknown",
      CampaignId: campaignId || "unknown",
      GroupId: groupId,
      TemplateId: templateId || "unknown",
    };
  }
  // Update type
  const changeEvent = letterEvent as LetterStatusChangeEvent;
  const groupId = changeEvent.data.groupId || "unknown";
  const [clientId, campaignId, templateId] = groupId.split("-");
  return {
    Supplier: changeEvent.data.supplierId || "unknown",
    Status: changeEvent.data.status,
    ClientId: clientId || "unknown",
    CampaignId: campaignId || "unknown",
    GroupId: groupId,
    TemplateId: templateId || "unknown",
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
    sha256Hash: upsertRequest.data.sha256Hash,
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
  metricKey: MetricStatus,
  dimensions: UpsertDimensions,
) {
  const namespace = process.env.AWS_LAMBDA_FUNCTION_NAME || "upsertLetter";

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

    let dimensions: UpsertDimensions = {
      Supplier: "unknown",
      Status: "unknown",
      ClientId: "unknown",
      CampaignId: "unknown",
      GroupId: "unknown",
      TemplateId: "unknown",
    };
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
        dimensions = extractDimensionsFromLetterEvent(
          letterEvent,
          allocationDetails,
        );
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
          MetricStatus.Failure,
          dimensions,
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
