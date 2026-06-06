# Upsert Letter Lambda

## Purpose

Consumes allocation and status-change messages from SQS and persists them to the letters DynamoDB table as inserts or updates.

## General Flow

1. Each SQS record body is parsed as a `QueueMessage`.
2. The event `type` determines whether the record is handled as an insert (`LetterRequestPreparedEvent` v1/v2) or an update (`LetterStatusChangeEvent`).
3. Insert records create new letters from allocation output; update records apply status and reason changes to existing letters.
4. Records are processed with idempotency (`IDEMPOTENCY_TABLE`) so retries do not duplicate work.
5. Success and failure metrics are emitted, and only true failures are returned as `batchItemFailures` for partial retry.

## Key Integration Points

- **SQS**: input from the supplier-allocator output queue.
- **`LetterRepository`** from `@internal/datastore`: `putLetter` for inserts, `updateLetterStatus` for updates.
- **`@aws-lambda-powertools/idempotency`**: backed by a DynamoDB persistence layer (`IDEMPOTENCY_TABLE`).
- **Event schemas**: `@nhsdigital/nhs-notify-event-schemas-letter-rendering` (v1 and v2) for insert operations; `@nhsdigital/nhs-notify-event-schemas-supplier-api` for update operations.

## Nuances and Peculiarities

- **Letters can be inserted with status REJECTED.** If the supplier-allocator could not resolve a supplier (e.g., no active allocations), it sets `allocationStatus.status = "REJECTED"`. The upsert handler respects this and inserts the letter with status REJECTED rather than PENDING.
- **Duplicate inserts are not failures.** If `putLetter` throws `LetterAlreadyExistsError`, the handler logs a warning and moves on without adding the record to `batchItemFailures`.
- **Update deduplication** uses a separate mechanism: `LetterRepository.updateLetterStatus` includes a DynamoDB condition expression checking `eventId` to skip already-processed updates (returns `undefined` rather than throwing).
- Idempotency keys on event `id` mean SQS retries for the same event are safe for both insert and update paths.
- The `billingRef` field in the letter record is set to `allocationDetails.supplierSpec.specId` (the pack specification ID), while `specificationBillingId` is set to `allocationDetails.supplierSpec.billingId`.
