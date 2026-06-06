# API Handler Lambdas

## Purpose

The primary supplier-facing Lambdas behind API Gateway. Contains handlers with logic to process print suppliers' requests to retrieve pending letters, update letter statuses, download letter data, and submit management information (MI).

## Exported Handlers

Each export in `src/index.ts` maps to a separate API Gateway route:

| Export | Endpoint | Description |
| --- | --- | --- |
| `getLetters` | `GET /letters` | Returns pending letters from the letter queue table with visibility-timeout locking |
| `getLetter` | `GET /letters/{id}` | Fetches a single letter by supplier and letter ID |
| `getLetterData` | `GET /letters/{id}/data` | Returns a 303 redirect to a time-limited S3 pre-signed URL for the letter PDF |
| `patchLetter` | `PATCH /letters/{id}` | Accepts a single letter status update, enqueues it to SQS |
| `postLetters` | `POST /letters` | Accepts a batch of letter status updates (up to `MAX_LIMIT`), enqueues them to SQS |
| `postMI` | `POST /mi` | Accepts a management information submission, persists it via `MIRepository` |
| `transformAmendmentEvent` | Supports patchLetters and postLetters | Processes queued `UpdateLetterCommand` messages, looks up the current letter, and publishes a `LetterStatusChangeEvent` to SNS |
| `getStatus` | `GET /_status` | Healthcheck that verifies DynamoDB and S3 connectivity |

## General Flow

1. A shared dependency container is created once at cold-start in `src/config/deps.ts` (DynamoDB, S3, SQS, SNS clients, repositories, env config).
2. Each handler extracts and validates common request identifiers (`nhsd-supplier-id`, `nhsd-correlation-id`, `x-request-id`) via `extractCommonIds`.
3. Request bodies are validated against Zod schemas in `src/contracts/letters.ts` and `src/contracts/mi.ts`.
4. For status updates (`PATCH`/`POST /letters`), the handler maps the request into `UpdateLetterCommand` objects and enqueues them.
5. The `transformAmendmentEvent` handler consumes those SQS messages, fetches the full letter from DynamoDB, builds a `LetterStatusChangeEvent` CloudEvent via `mapLetterToCloudEvent`, and publishes it to SNS for further processing (upsert).

## Key Integration Points

- **API Gateway**: Authorizer event model: supplier ID is injected by the authorizer Lambda as `principalId`.
- **DynamoDB**: `LetterRepository` for letter CRUD, `LetterQueueRepository` for pending letter queue reads with visibility timeout, `MIRepository` for MI writes.
- **S3**: pre-signed URL generation for letter PDF download via `getLetterDataUrl`.
- **SQS**: letter status update commands are batched and enqueued; `transformAmendmentEvent` reads from the same queue.
- **SNS**: `transformAmendmentEvent` publishes `LetterStatusChangeEvent` CloudEvents.

## Nuances and Peculiarities

- `GET /letters` reads from the **letter queue table** (not the main letters table) and updates each returned letter's `visibilityTimestamp`. Subsequent calls within the timeout window return an empty set, preventing duplicate dispatch to the same supplier.
- `GET /letters/{id}/data` returns HTTP 303 (not 200) with the pre-signed URL in the `Location` header.
- `POST /letters` enforces a duplicate letter ID check within a single request and a configurable max batch size (`MAX_LIMIT`).
- `transformAmendmentEvent` is an SQS-triggered handler bundled in the same Lambda package, not an API Gateway route. It bridges the async status update flow by looking up current letter state before publishing the event.
- Error responses are centralised through `processError` in the error mapper to produce a consistent JSON:API error shape across all endpoints.
