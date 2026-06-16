<!-- vale off -->

# @nhsdigital/nhs-notify-event-schemas-supplier-api

## Purpose

Defines the Zod schemas and TypeScript types for all CloudEvents produced and consumed within the supplier API domain. Published externally as `@nhsdigital/nhs-notify-event-schemas-supplier-api` and used by both internal lambdas and external consumers.

## General Structure

- **`src/domain/letter.ts`**: defines the `$Letter` schema (extends `DomainBase`) and `$LetterStatus`.
- **`src/domain/mi.ts`**: defines the `$MI` schema for management information records.
- **`src/events/event-envelope.ts`**: the `EventEnvelope` factory that creates the main schema for any domain entity. Generates `type` as `uk.nhs.notify.supplier-api.<resource>.<status>.v1`, representing letter status change events and MI submissions.
- **`src/events/letter-events.ts`**: exports the `$LetterStatusChangeEvent` schema for letter lifecycle events.
- **`src/events/mi-events.ts`**: exports `$MISubmittedEvent` for MI submission CloudEvents.

## Key Integration Points

- `upsert-letter` uses `$LetterStatusChangeEvent` on its update path. The same handler uses letter-rendering schemas (`LetterRequestPreparedEvent` v1/v2) for inserts, so `LetterStatusChangeEvent` is the key discriminator for _update_ processing.
- `api-handler` (`transformAmendmentEvent`) emits `LetterStatusChangeEvent` after supplier update commands are accepted and enriched.
- `letter-updates-transformer` emits `LetterStatusChangeEvent` for downstream consumers when a letter is inserted or when `status` or `reasonCode` changes.
- Those published events are consumed through EventPub by Core (and any other downstream consumers).
- Published to npm for external consumers who need to parse or validate supplier API events.

## Nuances and Peculiarities

- **`LetterStatusChangeEvent` is a central domain event, not just a transport type.** It links supplier-facing updates, async persistence, and outbound publication to Core.
- **Supplier status updates become domain events.** When suppliers call `PATCH /letters/{id}` or `POST /letters`, the API handler enqueues `UpdateLetterCommand` messages. These are transformed into `LetterStatusChangeEvent` payloads and ultimately persisted by `upsert-letter`.
- **Outbound lifecycle publication uses the same event shape.** `letter-updates-transformer` emits `LetterStatusChangeEvent` on letter INSERT and on `status`/`reasonCode` updates, which are then routed to downstream subscribers.
- **Must remain free of internal dependencies.** Since this package is published externally, it cannot import from `@internal/datastore`, `@internal/helpers`, or any other internal workspace package. All types are self-contained.
- **Schema version alignment**: the `dataschemaversion` in CloudEvents is derived from this package's `package.json` version, so bumping the package version directly affects the schema version in all emitted events. There's a GH workflow related to this.

<!-- vale on -->
