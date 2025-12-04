import { LetterSchemaBase, SupplierSchema } from "@internal/datastore";
import { idRef } from "@internal/helpers";
import { z } from "zod";

export const LetterSchemaWithSupplierId = LetterSchemaBase.extend({
  supplierId: idRef(SupplierSchema, "id"),
});

export type LetterWithSupplierId = z.infer<typeof LetterSchemaWithSupplierId>;
