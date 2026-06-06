---
title: Function Documentation
nav_order: 6
parent: Developer Guides
has_children: false
has_toc: true
---

This page bundles function-level README files from the Supplier API codebase.

## Data Flow Overview

Primary data flows passing through the system:

### Inbound (letter allocation and creation)

```
LetterRequestPreparedEvent (SNS)
  → supplier-allocator (SQS consumer)
    → resolves supplier via weighted fair-share algorithm
    → upsert-letter (SQS consumer)
      → inserts letter record into DynamoDB (letters table)
        → DynamoDB Stream → Kinesis
          → update-letter-queue: adds PENDING letters to queue table
          → letter-updates-transformer: publishes LetterStatusChangeEvent to SNS
```

### Supplier-facing (status updates)

```
Supplier calls GET /letters (api-handler)
  → reads from pending queue table with visibility timeout
Supplier calls PATCH /letters/{id} or POST /letters (api-handler)
  → enqueues UpdateLetterCommand to SQS
    → transformAmendmentEvent (SQS consumer, in api-handler package)
      → fetches current letter, publishes LetterStatusChangeEvent to SNS
    → upsert-letter (SQS consumer)
      → updates letter status in DynamoDB (letters table)
        → DynamoDB Stream → Kinesis
          → update-letter-queue: removes letter from pending queue
          → letter-updates-transformer: publishes LetterStatusChangeEvent to SNS
```

### MI submission

```
Supplier calls POST /mi (api-handler)
  → persists MI record to DynamoDB (mi table)
    → DynamoDB Stream → Kinesis
      → mi-updates-transformer: publishes MISubmittedEvent to SNS
```

### Supplier config ingestion

```
Supplier config event (SNS, type prefix uk.nhs.notify.supplier-config)
  → supplier-config SQS queue
    → supplier-config-ingress (SQS consumer)
      → upserts entity into supplier-config DynamoDB table
```

## Lambda Packages

### API Handler

{% include components/generated/readmes/lambda-api-handler.md %}

### Authorizer

{% include components/generated/readmes/lambda-authorizer.md %}

### Supplier Allocator

{% include components/generated/readmes/lambda-supplier-allocator.md %}

### Upsert Letter

{% include components/generated/readmes/lambda-upsert-letter.md %}

### Update Letter Queue

{% include components/generated/readmes/lambda-update-letter-queue.md %}

### Letter Updates Transformer

{% include components/generated/readmes/lambda-letter-updates-transformer.md %}

### MI Updates Transformer

{% include components/generated/readmes/lambda-mi-updates-transformer.md %}

### Supplier Config Ingress

{% include components/generated/readmes/lambda-supplier-config-ingress.md %}

## Internal Packages

### Datastore

{% include components/generated/readmes/internal-datastore.md %}

### Events

{% include components/generated/readmes/internal-events.md %}

### Event Builders

{% include components/generated/readmes/internal-event-builders.md %}

### Helpers

{% include components/generated/readmes/internal-helpers.md %}

## Tests

{% include components/generated/readmes/tests-overview.md %}

## Sandbox

{% include components/generated/readmes/sandbox.md %}

## Supplier Configuration

{% include components/generated/readmes/config-suppliers.md %}
