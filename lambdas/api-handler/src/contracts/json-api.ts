import { z } from "zod";

// Single document wrapper
export const makeDocumentSchema = <T extends z.ZodType>(resourceSchema: T) =>
  z.object({ data: resourceSchema }).strict();

// Collection document wrapper
export const makeCollectionSchema = <T extends z.ZodType>(resourceSchema: T) =>
  z.object({ data: z.array(resourceSchema) }).strict();
