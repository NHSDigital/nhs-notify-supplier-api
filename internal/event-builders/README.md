# @internal/event-builders

## Purpose

Provides functions to construct CloudEvent-compliant payloads from domain entities. Centralises event-building logic so that multiple lambdas produce structurally identical events.

## General Structure

- **`src/letter-mapper.ts`**: exports `mapLetterToCloudEvent(letter, source)` which converts a `Letter` domain object into a full `LetterStatusChangeEvent` CloudEvent.

## Key Integration Points

- **Used by**: `letter-updates-transformer` (publish letter updates to core) and `amendment-event-transformer` (process incoming letter updates).

## Nuances and Peculiarities

- Each call to `mapLetterToCloudEvent` generates a fresh `randomUUID` for the event `id` and random bytes for `traceparent`, so the same letter domain object will produce a unique event every time it is called.
- The `data.origin.event` field is set to the **new event ID** (not the original event that created the letter), establishing a fresh trace link per emission.
- Independent package to allow for type imports across the project without circular dependencies.
