<!-- vale off -->

# Supplier Configuration

## Purpose

Static JSON configuration files that define the supplier allocation rules for the Supplier API. These are loaded into DynamoDB by infrastructure tooling and are queried at runtime by the `supplier-allocator` Lambda. Check relevant repositories (nhs-notify-internal, nhs-notify-supplier-config) as they orchestrate supplier config data ingress depending on target account, environment, etc.

## Configuration Entities

| Entity                  | Directory              | Description                                                                                                                                                    |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supplier**            | `supplier/`            | Print supplier definitions with ID, name, channel type, daily capacity, and status (PROD/DRAFT)                                                                |
| **Letter Variant**      | `letter-variant/`      | Letter type definitions with physical constraints (sheets, sides, ink coverage, delivery days), associated pack specification IDs, and volume group assignment |
| **Volume Group**        | `volume-group/`        | Groupings of letter variants for allocation purposes, with status and date range validity                                                                      |
| **Supplier Allocation** | `supplier-allocation/` | Maps a supplier to a volume group with a target `allocationPercentage` and status                                                                              |
| **Pack Specification**  | `pack-specification/`  | Detailed print assembly specs (paper, envelope, print colour, duplex) with constraints and billing ID                                                          |
| **Supplier Pack**       | `supplier-pack/`       | Links a supplier to a pack specification with approval status                                                                                                  |

## Allocation Lookup Chain

When the `supplier-allocator` Lambda processes a `LetterRequestPreparedEvent`:

1. The event's `letterVariantId` identifies the **Letter Variant**.
2. The variant's `volumeGroupId` identifies the **Volume Group** (must be `PROD` status and within date range).
3. **Supplier Allocations** for that volume group determine which suppliers are eligible and their target allocation percentages (must sum to 100).
4. The variant's `packSpecificationIds` are filtered by the letter's physical constraints.
5. **Supplier Packs** confirm which eligible suppliers support the selected pack specification.
6. The supplier with the lowest weighted allocation factor (furthest below their target share) is selected.

## Nuances and Peculiarities

- These files are the source of truth for the supplier config DynamoDB table (`SUPPLIER_CONFIG_TABLE_NAME`). Changes here flow into DynamoDB via infrastructure deployment.
- Runtime persistence is event-driven: supplier-config events are routed through SQS to the `supplier-config-ingress` Lambda, which upserts records into the config table.
- `status: "PROD"` is required at multiple levels (supplier, volume group, allocation) for an allocation to be active.
- Volume groups have `startDate` (and optional `endDate`) fields. Allocations are only valid when the current date falls within this range (evaluated in London timezone).
- Supplier `dailyCapacity` is tracked separately in `SUPPLIER_QUOTAS_TABLE` and resets at midnight London time. It is not stored in these config files.

<!-- vale on -->
