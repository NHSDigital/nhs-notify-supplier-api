import { z } from "zod";
import { LetterStatus } from "internal/datastore/src";

export const IncomingLetterSchema = z.object({
  id: z.string(),
  status: LetterStatus,
  specificationId: z.string(),
  supplierId: z.string(),
  groupId: z.string(),
});

export type IncomingLetter = z.infer<typeof IncomingLetterSchema>;
