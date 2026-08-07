<!-- vale off -->

# Supplier Allocator Lambda

## Purpose

Consumes `LetterRequestPrepared` events (v1 and v2) from an SQS queue, chooses a supplier using configuration and quota data, and forwards the allocation result to the upsert-letter queue.

## General Flow

1. The handler receives an SQS batch of letter-request events.
2. Each record body is parsed and validated as either `$LetterRequestPreparedEventV2` or `$LetterRequestPreparedEvent` (v1 fallback).
3. The allocator loads the relevant supplier configuration from `SUPPLIER_CONFIG_TABLE`, including the letter variant, active volume group, candidate suppliers, and compatible pack details.
4. Candidate suppliers are filtered using pack support and daily capacity, then ranked using quota data from `SUPPLIER_QUOTAS_TABLE`.
5. On success, the handler produces an allocation with `allocationStatus.status = "PENDING"` and sends `{ letterEvent, allocationDetails }` to `UPSERT_LETTERS_QUEUE_URL`.
6. If a `SupplierConfigError` is raised, the original record is sent directly to `SUPPLIER_ALLOCATOR_DLQ_URL` and acknowledged so it is not retried.
7. Any other processing error is returned in `batchItemFailures` so SQS retries the record based on the source queue redrive policy.
8. After the batch completes, allocation counters are written back to `SUPPLIER_QUOTAS_TABLE`.

## Key Integration Points

- **SQS**: Input from EventSub, output to the upsert-letter queue (`UPSERT_LETTERS_QUEUE`), and direct publish to the allocator DLQ (`SUPPLIER_ALLOCATOR_DLQ_URL`) for `SupplierConfigError`.
- **`SupplierConfigRepository`** from `@internal/datastore` (`SUPPLIER_CONFIG_TABLE`): reads letter variants, volume groups, supplier allocations, pack specifications, and supplier packs.
- **`SupplierQuotasRepository`** from `@internal/datastore` (`SUPPLIER_QUOTAS_TABLE`): reads and writes daily and overall allocation counts per volume group and supplier.
- **Event schemas**: `@nhsdigital/nhs-notify-event-schemas-letter-rendering` (v2) and `@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1` (v1).
- **Downstream consumer**: `upsert-letter` receives `{ letterEvent, allocationDetails }` and persists PENDING letters.

## Nuances and Peculiarities

- **`SupplierConfigError` is treated as terminal for retries.** The handler sends the original message directly to the allocator DLQ and acknowledges the source record.
- **All other failures retain normal retry semantics.** Non-`SupplierConfigError` records are returned in `batchItemFailures` and retried according to queue configuration.
- **The factor algorithm is a running weighted average across the lifetime of the system, not per-batch.** The `overallAllocation` table accumulates counts since deployment. A supplier that handled a disproportionate share yesterday will have a high factor today and be deprioritised, allowing others to catch up to their target percentage.
- **Daily capacity check uses London timezone.** `format(toZonedTime(new Date(), "Europe/London"), "yyyy-MM-dd")` determines the date key. Capacity resets at midnight London time, not UTC.
- **Quota updates happen after the entire batch completes**, not per-record. This optimisation means concurrent Lambda invocations can transiently over-allocate a supplier before quotas are reconciled.

<!-- vale on -->
