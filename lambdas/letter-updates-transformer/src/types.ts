import { LetterSchema } from "@internal/datastore";
import { z } from "zod";

export const LetterSchemaForEventPub = LetterSchema.omit({
  supplierStatus: true,
  supplierStatusSk: true,
  ttl: true,
});

export type LetterForEventPub = z.infer<typeof LetterSchemaForEventPub>;
