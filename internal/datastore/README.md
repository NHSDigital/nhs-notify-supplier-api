<!-- vale off -->

# @internal/datastore

## Purpose

Shared data-access layer providing DynamoDB repository implementations, domain types, and error classes for the supplier API.

## General Structure

- **`src/types.ts`**: Zod schemas and TypeScript types for `Letter`, `InsertLetter`, `UpdateLetter`, `PendingLetter`, `MI`, `Supplier`, and related entities.
- **`src/letter-repository.ts`**: `LetterRepository` — CRUD for the main letters DynamoDB table
- **`src/letter-queue-repository.ts`**: `LetterQueueRepository` — manages the pending letter queue projection table:
  - `getLetters`: paginated query with visibility-timeout update to prevent duplicate dispatch.
- **`src/mi-repository.ts`**: `MIRepository` — writes MI records.
- **`src/supplier-repository.ts`**: `SupplierRepository` — looks up suppliers by APIM application ID / supplierId.
- **`src/supplier-config-repository.ts`**: `SupplierConfigRepository` — reads letter variants, volume groups, supplier allocations, pack specifications, and supplier packs from the config table.
- **`src/supplier-quotas-repository.ts`**: `SupplierQuotasRepository` — reads and writes daily and overall allocation counts used by the supplier-allocator.
- **`src/healthcheck.ts`**: `DBHealthcheck` — verifies DynamoDB table and S3 bucket connectivity.
- **`src/errors/`**: Common application errors, which determine some of the API's error responses.

## Key Integration Points

- **`@nhsdigital/nhs-notify-event-schemas-supplier-config`**: Zod schemas for supplier configuration entities.
- **Consumers**: every Lambda in this repository depends on this package.

## Nuances and Peculiarities

- The **letter queue table** is a separate DynamoDB table from the main letters table. It acts as a priority queue projection, maintained by the `update-letter-queue` Lambda from Kinesis stream events.
- `LetterQueueRepository` implements a **visibility timeout** pattern: each returned letter's `visibilityTimestamp` is updated so subsequent queries within the timeout window skip it, preventing duplicate dispatch.
<!-- vale on -->
