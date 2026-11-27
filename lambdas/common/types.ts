import { z } from "zod";

const SupplierSpecSchema = z.object({
  supplierId: z.string().min(1),
  specId: z.string().min(1),
  priority: z.int().min(0).max(99).default(10),
  billingId: z.string().min(1),
});

const AllocationStatusSchema = z.object({
  status: z.string().min(1),
  reasonCode: z.string().min(1).optional(),
  reasonText: z.string().min(1).optional(),
});

export type AllocationStatus = z.infer<typeof AllocationStatusSchema>;

export type SupplierSpec = z.infer<typeof SupplierSpecSchema>;

export const AllocationDetailsSchema = z.object({
  supplierSpec: SupplierSpecSchema,
  allocationStatus: AllocationStatusSchema,
});
export type AllocationDetails = z.infer<typeof AllocationDetailsSchema>;

export const $MinimumLetterEvent = z.object({
  id: z.string(),
  type: z.string(),
  source: z.string(),
  subject: z.string(),
  data: z.object({
    letterVariantId: z.string(),
    domainId: z.string(),
    pageCount: z.number(),
    campaignId: z.string().optional(),
    clientId: z.string(),
    templateId: z.string().optional(),
    url: z.url(),
    sha256Hash: z.string(),
    status: z.literal("PREPARED").optional(),
  }),
});

export type MinimumLetterEvent = z.infer<typeof $MinimumLetterEvent>;
