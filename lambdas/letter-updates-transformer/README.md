<!-- vale off -->

# Letter Updates Transformer Lambda

## Purpose

Publishes `LetterStatusChangeEvent` CloudEvents to SNS whenever a letter's status or reason code changes in the letters DynamoDB table. This is the primary mechanism by which downstream NHS Notify Bounded Contexts (Core) learn about letter lifecycle transitions.

## General Flow

1. The Lambda receives a Kinesis batch of DynamoDB stream images from the letters table.
2. A filter determines which records warrant an event:
   - **INSERT** events always pass (a new letter was created).
   - **MODIFY** events pass only if `status` **or** `reasonCode` changed between old and new images.
   - REMOVE events and status-unchanged MODIFYs are discarded.
3. Qualifying letters are mapped to `LetterStatusChangeEvent`.
4. Events are published to SNS - eventPub.
5. Metrics are emitted per event type (e.g., `letter.ACCEPTED`, `letter.DISPATCHED`) to track the volume of each status transition.

## Key Integration Points

- **Kinesis**: DynamoDB Streams from the letters table, providing ordered change records per partition.
- **SNS**: The eventPub is the target topic for `LetterStatusChangeEvent` CloudEvents which are then consumed by Core.

## Nuances and Peculiarities

- The filter checks both `status` and `reasonCode` for changes. A MODIFY that only updates `reasonCode` (e.g., adding a reason to an existing status) will still emit an event.
- **REJECTED letters do emit events.** A letter inserted with status REJECTED will match the INSERT filter and produce a `letter.REJECTED` CloudEvent. Downstream consumers will see it immediately.
- The `dataschemaversion` in each CloudEvent is dynamically set from the `@nhsdigital/nhs-notify-event-schemas-supplier-api` package version, ensuring schema version alignment with the published package.
- Metrics are aggregated by event type string (e.g., `letter.PENDING`) so operational dashboards can monitor the frequency of each transition.

<!-- vale on -->
