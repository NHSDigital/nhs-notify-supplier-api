import { z } from "zod";

export const $MI = z
  .object({
    id: z.string(),
    lineItem: z.string(),
    timestamp: z.string(),
    quantity: z.number(),
    specificationId: z.string().optional(),
    groupId: z.string().optional(),
    stockRemaining: z.number().optional(),
    supplierId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .describe("MI");

export type MI = z.infer<typeof $MI>;
