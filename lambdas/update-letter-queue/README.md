<!-- vale off -->

# Update Letter Queue Lambda

## Purpose

Maintains the pending letter queue DynamoDB table as a projection of the main letters table. Processes Kinesis stream records from the letters table's DynamoDB Streams and adds or removes letters from the queue table based on status transitions.

## General Flow

1. The Lambda receives a Kinesis batch. Each record's `data` field is a base64-encoded DynamoDB stream image containing `eventName` (INSERT, MODIFY, REMOVE) and the old/new images.
2. For each record, two checks are applied:
   - **`isNewPendingLetter`**: the record is an INSERT with `NewImage.status = PENDING`. The letter is added to the queue table via `LetterQueueRepository.putLetter`.
   - **`isNoLongerPending`**: the record is a MODIFY where `OldImage.status = PENDING` and `NewImage.status != PENDING`. The letter is removed from the queue table via `LetterQueueRepository.deleteLetter`.
3. Records that match neither condition are skipped (REMOVE events, MODIFY with no PENDING transition, inserts with non-PENDING status such as REJECTED).
4. Success/failure delta counts are tracked per `supplierId` and emitted as CloudWatch EMF metrics.
5. On any hard error, the handler returns immediately with `batchItemFailures` for the failing Kinesis sequence number so the shard retries from that point.

## Key Integration Points

- **Kinesis**: letter table DynamoDB Streams piped through Kinesis for ordered, replay-safe delivery.
- **`LetterQueueRepository`** from `@internal/datastore`: `putLetter` and `deleteLetter` on the queue projection table.
- **`@internal/helpers`**: EMF metrics via `emitForSingleSupplier` and `buildEMFObject`.

## Nuances and Peculiarities

- **Replay safety**: `LetterAlreadyExistsError` on insert and `LetterNotFoundError` on delete are treated as success (return 0, not added to failures). Kinesis replays after a checkpoint failure will not produce false alarms.
- **REJECTED letters are never queued.** Letters inserted with status REJECTED (from a failed supplier allocation) are INSERT events but with `status != PENDING`, so `isNewPendingLetter` returns false and they are not added to the queue.
- **Immediate failure return**: on any unexpected error, the handler stops processing remaining records and returns the failing sequence number in `batchItemFailures`, maintaining Kinesis ordering guarantees.
- Queue entries use a composite `queueSortOrderSk` (zero-padded priority + ISO timestamp) to enable priority-ordered retrieval by the API handler's `GET /letters` endpoint.

<!-- vale on -->
