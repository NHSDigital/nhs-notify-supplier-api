import { z } from "zod";

export const LetterApiStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "PRINTED",
  "ENCLOSED",
  "CANCELLED",
  "DISPATCHED",
  "FAILED",
  "RETURNED",
  "DESTROYED",
  "FORWARDED",
  "DELIVERED",
]);

export type LetterApiStatus = z.infer<typeof LetterApiStatusSchema>;

export const LetterApiAttributesSchema = z.object({
  status: LetterApiStatusSchema,
  specificationId: z.string(),
  groupId: z.string().optional(),
  reasonCode: z.number().optional(),
  reasonText: z.string().optional(),
});

export type LetterApiAttributes = z.infer<typeof LetterApiAttributesSchema>;

export const LetterApiResourceSchema = z.object({
  id: z.string(),
  type: z.literal("Letter"),
  attributes: LetterApiAttributesSchema
});

export type LetterApiResource = z.infer<typeof LetterApiResourceSchema>;

export const LetterApiDocumentSchema = z.object({
  data: LetterApiResourceSchema
});

export const LettersApiDocumentSchema = z.object({
  data: z.array(LetterApiResourceSchema)
});

export type LetterApiDocument = z.infer<typeof LetterApiDocumentSchema>;

export type LettersApiDocument = z.infer<typeof LettersApiDocumentSchema>;
