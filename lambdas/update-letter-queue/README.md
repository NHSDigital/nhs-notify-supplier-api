<!-- vale off -->

# Update Letter Queue Lambda

## Purpose

Maintains the pending letter queue DynamoDB table as a projection of the main letters table. DynamoDB writes changes directly to a Kinesis Data Stream, and this Lambda adds or removes letters from the queue table based on status transitions.

## General Flow

1. The Lambda receives a Kinesis batch. Each record's `data` field is a base64-encoded DynamoDB stream image containing `eventName` (INSERT, MODIFY, REMOVE) and the old/new images.
2. Records for different letters are processed concurrently; records for the same supplier/letter are processed in Kinesis batch order. For each record, two checks are applied:
   - **`isPendingLetter`**: `NewImage.status = PENDING` (an INSERT, or a MODIFY that leaves the letter PENDING). The letter is added to the queue table via `LetterQueueRepository.putLetter`; if it is already queued this is a no-op.
   - **`isNoLongerPending`**: the record is a MODIFY where `OldImage.status = PENDING` and `NewImage.status != PENDING`. The letter is removed from the queue table via `LetterQueueRepository.deleteLetter`.
3. Records that match neither condition are ignored (REMOVE events, MODIFY with no PENDING transition, inserts with non-PENDING status such as REJECTED).
4. Successful queue additions/removals are counted, and the net queue delta is emitted as a CloudWatch EMF `QueueDelta` metric per `supplierId`.
5. After all tasks settle, the handler reports the earliest failed Kinesis sequence number in `batchItemFailures` so the shard retries from that point. Later records for that same letter are deferred to the retry; independent letters may already have been processed.
6. Records that can never be processed are dropped rather than retried (see below), so they cannot block the shard.

## Key Integration Points

- **Kinesis**: DynamoDB's Kinesis streaming destination captures letter-table changes for this Lambda and the `letter-updates-transformer`.
- **`LetterQueueRepository`** from `@internal/datastore`: `putLetter` and `deleteLetter` on the queue projection table.
- **`@internal/helpers`**: EMF metric construction via `buildEMFObject`.

## Nuances and Peculiarities

- **Conditional writes**: inserts only succeed if the letter is not already queued, and deletes only if it is. `LetterAlreadyExistsError` and `LetterNotFoundError` are treated as successful no-ops (delta 0) and logged at INFO. They occur on retries, when a queued letter is modified but stays PENDING, and when a queue entry has already expired.
- **Updates to a PENDING letter**: a MODIFY that leaves the letter PENDING attempts an insert, which is a no-op if the letter is already queued. The existing queue entry is not updated.
- **REJECTED letters are never queued.** Letters inserted with status REJECTED (from a failed supplier allocation) are INSERT events but with `status != PENDING`, so `isPendingLetter` returns false and they are not added to the queue.
- **Partial-batch retry**: the event source mapping retries from the earliest failed record, so later records already processed for other letters are processed again. The conditional writes make those repeats no-ops.
- **Only the fields used are validated**: an insert parses `supplierId`, `id`, `specificationId`, `groupId`, `priority` and `sha256Hash`; a delete parses only `supplierId` and `id`. Changes to other letter fields, such as a new required field that older letters lack, do not affect this Lambda.
- **Failures that are retried vs dropped**:
  - A queue write error (for example DynamoDB throttling) is reported in `batchItemFailures` and retried.
  - A payload that cannot be decoded, or a letter missing a field this Lambda needs, can never succeed on retry. It is logged at ERROR (`013-ERROR-EXTRACTING-PAYLOAD` or `014-INVALID-LETTER-DROPPED`, with `recordId` and `supplierId`/`letterId`; for an invalid letter the IDs are `null` when missing, and `invalidFields` lists each failing field and why), counted as `droppedCount` in the summary log, and not retried. Later records for the same letter are still processed.
  - A dropped record's queue change is lost. The queue entry for that letter may be missing or stale (until its TTL) until the letter changes again.
- **Logging at INFO**: one line per queue outcome (`004-LETTER-ADDED`, `006-LETTER-REMOVED`, or the `005`/`007` no-ops), with `supplierId` and `letterId` only, plus one `008-COMPLETE` summary and one `009-METRIC` per supplier per batch. Records that don't touch the queue log nothing at INFO. Decoded payloads and full events are logged at DEBUG only.
- **Queue entry expiry**: queue entries have a TTL of `letter_queue_ttl_hours` (default 168 hours).
- Queue entries use a composite `queueSortOrderSk` (zero-padded priority + ISO timestamp) to enable priority-ordered retrieval by the API handler's `GET /letters` endpoint.

<!-- vale on -->
