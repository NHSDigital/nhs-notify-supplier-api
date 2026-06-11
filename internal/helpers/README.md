<!-- vale off -->

# @internal/helpers

## Purpose

Central shared utility package providing logging, CloudWatch metrics, environment validation, and common primitives used across all lambdas and internal packages.

## General Structure highlights

- **`src/logger.ts`**: `createLogger(options?)` — creates a `pino` logger with uppercase level labels and ISO timestamps. Used by every Lambda's dependency container.
- **`src/metrics.ts`**: CloudWatch Embedded Metric Format (EMF) utilities:
  - `emitForSingleSupplier(metrics, functionName, supplierId, count, message, dimensions?)` — emits a metric dimensioned by supplier ID using `aws-embedded-metrics`.
  - `buildEMFObject(functionName, dimensions, metric)` — builds a raw EMF JSON object for direct logging (used by stream-processing lambdas).
  - `MetricEntry` interface and `MetricStatus` enum (`Success`/`Failure`).

## Key Integration Points

- Imported by every Lambda and by `@internal/datastore` and `@internal/event-builders`.
- `pino` is the only logging library used across the codebase.
- `aws-embedded-metrics` is used for CloudWatch metric emission in Lambda context.

## Nuances and Peculiarities

- Changes to this package affect the runtime behaviour of all lambdas. Keep interfaces stable and changes backward-compatible.

<!-- vale on -->
