<!-- vale off -->

# Update Letter Queue Lambda

## Purpose

Maintains the pending letter queue DynamoDB table as a projection of the main letters table. Processes Kinesis stream records from the letters table's DynamoDB Streams and adds or removes letters from the queue table based on status transitions.

## General Flow

1. The Lambda receives a Kinesis batch. Each record's `data` field is a base64-encoded DynamoDB stream image containing `eventName` (INSERT, MODIFY, REMOVE) and the old/new images.
2. Records for different letters are processed concurrently; records for the same supplier/letter are processed in stream order. For each record, two checks are applied:
   - **`isPendingLetter`**: `NewImage.status = PENDING` (an INSERT, or a MODIFY that leaves the letter PENDING). The letter is added to the queue table via `LetterQueueRepository.putLetter`; if it is already queued this is a no-op.
   - **`isNoLongerPending`**: the record is a MODIFY where `OldImage.status = PENDING` and `NewImage.status != PENDING`. The letter is removed from the queue table via `LetterQueueRepository.deleteLetter`.
3. Records that match neither condition are ignored (REMOVE events, MODIFY with no PENDING transition, inserts with non-PENDING status such as REJECTED).
4. Success/failure delta counts are tracked per `supplierId` and emitted as CloudWatch EMF metrics.
5. After all tasks settle, the handler reports the earliest failed Kinesis sequence number in `batchItemFailures` so the shard retries from that point. Later records for that same letter are deferred to the retry; independent letters may already have been processed.

## Key Integration Points

- **Kinesis**: letter table DynamoDB Streams piped through Kinesis for ordered, replay-safe delivery.
- **`LetterQueueRepository`** from `@internal/datastore`: `putLetter` and `deleteLetter` on the queue projection table.
- **`@internal/helpers`**: EMF metrics via `emitForSingleSupplier` and `buildEMFObject`.

## Nuances and Peculiarities

- **Replay safety**: `LetterAlreadyExistsError` on insert and `LetterNotFoundError` on delete are treated as success (return 0, not added to failures). Kinesis replays after a checkpoint failure will not produce false alarms.
- **REJECTED letters are never queued.** Letters inserted with status REJECTED (from a failed supplier allocation) are INSERT events but with `status != PENDING`, so `isPendingLetter` returns false and they are not added to the queue.
- **Partial-batch retry**: the event source mapping retries from the earliest failed record, including later records already processed for other letters. Conditional queue writes make those replays safe.
- **Undecodable records**: if a record's payload cannot be decoded its letter is unknown, so every later record in the batch is deferred to the retry rather than risk applying a later change for the same letter first. Such a record fails on every retry and blocks the shard until it expires from the stream.
- Queue entries use a composite `queueSortOrderSk` (zero-padded priority + ISO timestamp) to enable priority-ordered retrieval by the API handler's `GET /letters` endpoint.

<!-- vale on -->
