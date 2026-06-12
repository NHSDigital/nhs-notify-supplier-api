<!-- vale off -->

# Supplier Config Ingress Lambda

## Purpose

Consumes supplier-config events from SQS and upserts supplier configuration entities into the supplier config DynamoDB table.

## General Flow

1. The handler receives a batch of SQS messages from the supplier-config queue.
2. The entity is extracted from the event type (for example `uk.nhs.notify.supplier-config.supplier-api.letter-variant.updated`).
3. The payload is validated using the schema mapped to that entity type.
4. The entity is upserted into `SUPPLIER_CONFIG_TABLE` via `SupplierConfigRepository.upsertSupplierConfig`.
5. EMF metrics are emitted for success (`result=CREATED|UPDATED`) and failure.
6. Failed records are returned in `batchItemFailures` so SQS retries only those messages.

## Supported Entities

- `letter-variant`
- `volume-group`
- `supplier-allocation`
- `supplier`
- `pack-specification`
- `supplier-pack`

## Key Integration Points

- **Input queue**: SQS queue subscribed to EventSub SNS topic with a message-body filter (`type` prefix `uk.nhs.notify.supplier-config`).
- **`SupplierConfigRepository`** from `@internal/datastore`: performs DynamoDB upserts by entity and ID.
- **Entity schemas**: `@nhsdigital/nhs-notify-event-schemas-supplier-config` validates each supported entity payload.
- **Observability**: `@internal/helpers` EMF metrics under namespace `supplier-config-ingress`.

## Nuances and Peculiarities

- The handler derives the entity from the event type by splitting on `.` and reading element index 4, so the event type format is significant.
- Upsert uses DynamoDB `UpdateItem` and returns whether a record was created or updated based on previous item existence.
- Only records that fail parsing or upsert are retried because of `ReportBatchItemFailures` semantics.
- Unknown or malformed event types are reported with failure metrics using `entity=unknown`.

<!-- vale on -->
