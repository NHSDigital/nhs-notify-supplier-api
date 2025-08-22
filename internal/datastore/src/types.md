# Data Store Schemas

This document contains the mermaid diagrams for the data store schemas used in the application.

The schemas are generated from Zod definitions and provide a visual representation of the data structure.

## Letter schema

```mermaid
erDiagram
    Letter {
        string id
        string supplierId "ref: Supplier"
        string specificationId
        string groupId
        string url "url"
        string status "enum: PENDING, ACCEPTED, REJECTED, PRINTED, ENCLOSED, CANCELLED, DISPATCHED, FAILED, RETURNED, DESTROYED, FORWARDED, DELIVERED"
        string createdAt
        string updatedAt
        string supplierStatus
        number ttl "min: -9007199254740991, max: 9007199254740991"
    }
    Supplier {
    }
    Letter }o--|| Supplier : "supplierId"
```

## MI schema

```mermaid
erDiagram
    MI {
        string id
        string supplierId "ref: Supplier"
        string specificationId
        string groupId
        string lineItem
        number quantity
        number stockRemaining
        string createdAt
        string updatedAt
    }
    Supplier {
    }
    MI }o--|| Supplier : "supplierId"
```
