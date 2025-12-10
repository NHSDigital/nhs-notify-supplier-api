import { LetterSchemaBase, SupplierSchema } from "@internal/datastore";
import { idRef } from "@internal/helpers";
import { z } from "zod";

export const LetterSchemaForEventPub = LetterSchemaBase.extend({
  supplierId: idRef(SupplierSchema, "id"),
  updatedAt: z.string(),
});

export type LetterForEventPub = z.infer<typeof LetterSchemaForEventPub>;
