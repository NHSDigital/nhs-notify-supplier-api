import { z } from "zod";
import { idRef } from "@internal/helpers";
import {
  $Supplier,
  $VolumeGroup,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config";

export const SupplierStatus = z.enum(["ENABLED", "DISABLED"]);

export const SupplierSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    apimId: z.string(),
    status: SupplierStatus,
    updatedAt: z.string(),
  })
  .describe("Supplier");

export type Supplier = z.infer<typeof SupplierSchema>;

export const LetterStatus = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "PRINTED",
  "ENCLOSED",
  "CANCELLED",
  "DISPATCHED",
  "FAILED",
  "RETURNED",
  "FORWARDED",
  "DELIVERED",
]);

export type LetterStatusType = z.infer<typeof LetterStatus>;

export const LetterSchemaBase = z.object({
  id: z.string(),
  status: LetterStatus,
  specificationId: z.string(),
  groupId: z.string(),
  reasonCode: z.string().optional(),
  reasonText: z.string().optional(),
});

export const LetterSchema = LetterSchemaBase.extend({
  supplierId: idRef(SupplierSchema, "id"),
  eventId: z.string().optional(),
  priority: z.int().min(0).max(99).optional(), // A lower number represents a higher priority
  url: z.url(),
  createdAt: z.string(),
  updatedAt: z.string(),
  previousStatus: LetterStatus.optional(),
  supplierStatus: z.string().describe("Secondary index PK"),
  supplierStatusSk: z.string().describe("Secondary index SK"),
  ttl: z.int(),
  source: z.string(),
  subject: z.string(),
  billingRef: z.string(),
  specificationBillingId: z.string().optional(),
}).describe("Letter");

/**
 * Letter is the type used for storing letters in the database.
 * The supplierStatus is a composite key combining supplierId and status.
 * The ttl is used for automatic deletion of old letters.
 */
export type Letter = z.infer<typeof LetterSchema>;
export type LetterBase = z.infer<typeof LetterSchemaBase>;

export type InsertLetter = Omit<
  Letter,
  "ttl" | "supplierStatus" | "supplierStatusSk"
>;
export type UpdateLetter = {
  id: string;
  eventId: string;
  supplierId: string;
  status: Letter["status"];
  reasonCode?: string;
  reasonText?: string;
};

export const PendingLetterSchemaBase = z.object({
  supplierId: idRef(SupplierSchema, "id"),
  letterId: idRef(LetterSchema, "id"),
  specificationId: z.string(),
  groupId: z.string(),
});

export const PendingLetterSchema = PendingLetterSchemaBase.extend({
  queueTimestamp: z.string(),
  visibilityTimestamp: z.string(),
  queueSortOrderSk: z.string().describe("Secondary index SK"),
  priority: z.int().min(0).max(99).optional(),
  ttl: z.int(),
});

export const InsertPendingLetter = PendingLetterSchemaBase.extend({
  priority: z.int().min(0).max(99).optional(),
});

export type PendingLetter = z.infer<typeof PendingLetterSchema>;
export type PendingLetterBase = z.infer<typeof PendingLetterSchemaBase>;
export type InsertPendingLetter = z.infer<typeof InsertPendingLetter>;

export const MISchemaBase = z.object({
  id: z.string(),
  lineItem: z.string(),
  timestamp: z.string(),
  quantity: z.number(),
  specificationId: z.string().optional(),
  groupId: z.string().optional(),
  stockRemaining: z.number().optional(),
});

export const MISchema = MISchemaBase.extend({
  supplierId: idRef(SupplierSchema, "id"),
  createdAt: z.string(),
  updatedAt: z.string(),
  ttl: z.int(),
}).describe("MI");

export type MI = z.infer<typeof MISchema>;
export type MIBase = z.infer<typeof MISchemaBase>;

export const $OverallAllocation = z
  .object({
    id: z.string(),
    volumeGroup: idRef($VolumeGroup, "id"),
    allocations: z.record(
      idRef($Supplier, "id"),
      z.number().int().nonnegative(),
    ),
  })
  .meta({
    title: "OverallAllocation",
    description:
      "The overall allocation for a volume group, including all suppliers",
  });

export type OverallAllocation = z.infer<typeof $OverallAllocation>;

export const $DailyAllocation = z
  .object({
    id: z.string(),
    date: z.ZodISODate,
    volumeGroup: idRef($VolumeGroup, "id"),
    allocations: z.record(
      idRef($Supplier, "id"),
      z.number().int().nonnegative(),
    ),
  })
  .meta({
    title: "DailyAllocation",
    description:
      "The daily allocation for a volume group, including all suppliers",
  });

export type DailyAllocation = z.infer<typeof $DailyAllocation>;
