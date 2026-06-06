# MI Updates Transformer Lambda

## Purpose

Publishes `MISubmittedEvent` CloudEvents to SNS whenever new management information records are inserted into the MI DynamoDB table via supplier PUT requests.

## General Flow

1. The Lambda receives a Kinesis batch of DynamoDB stream images from the MI table.
2. Only `INSERT` events are processed. MODIFY and REMOVE events are filtered out.
3. Each new MI record is unmarshalled against `MISchema` from `@internal/datastore` and mapped to an `MISubmittedEvent` CloudEvent via `mapMIToCloudEvent`.
4. Events are published to SNS.
5. Metrics are emitted per event type.

## Key Integration Points

- **Kinesis**: DynamoDB Streams from the MI table.
- **SNS**: EventPub being the target topic for `MISubmittedEvent` CloudEvents.
- **`MISubmittedEvent`** from `@nhsdigital/nhs-notify-event-schemas-supplier-api`: defines the CloudEvents envelope for MI submissions.
- **`@internal/helpers`**: `buildEMFObject` for CloudWatch EMF metrics.

## Nuances and Peculiarities

- Only INSERT events produce CloudEvents. MI records are immutable once written, so MODIFY and REMOVE are not expected in normal operation and are silently discarded.
- The handler structure mirrors `letter-updates-transformer` closely (same batching, decoding, and metrics patterns), but the filter is simpler (INSERT-only vs. status-change detection).
- The `mapMIToCloudEvent` mapper is local to this package (`src/mappers/mi-mapper.ts`) rather than shared in `@internal/event-builders`, since MI events have a different domain structure.
