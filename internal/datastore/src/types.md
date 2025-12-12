# Data Store Schemas

This document contains the mermaid diagrams for the data store schemas used in the application.

The schemas are generated from Zod definitions and provide a visual representation of the data structure.

## Letter schema

```mermaid
erDiagram
    Letter {
        string id
        string status "enum: PENDING, ACCEPTED, REJECTED, PRINTED, ENCLOSED, CANCELLED, DISPATCHED, FAILED, RETURNED, FORWARDED, DELIVERED"
        string specificationId
        string groupId
        string reasonCode
        string reasonText
        string supplierId
        string url "url"
        string createdAt
        string updatedAt
        string supplierStatus
        string supplierStatusSk
        number ttl "min: -9007199254740991, max: 9007199254740991"
    }
```

## MI schema

```mermaid
erDiagram
    MI {
        string id
        string lineItem
        string timestamp
        number quantity
        string specificationId
        string groupId
        number stockRemaining
        string supplierId
        string createdAt
        string updatedAt
        number ttl "min: -9007199254740991, max: 9007199254740991"
    }
```

## Supplier schema

```mermaid
erDiagram
    Supplier {
        string id
        string name
        string apimId
        string status "enum: ENABLED, DISABLED"
        string updatedAt
    }
```
