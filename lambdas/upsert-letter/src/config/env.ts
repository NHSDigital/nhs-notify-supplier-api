import { z } from "zod";

const LetterVariantSchema = z.record(
  z.string(),
  z.object({
    supplierId: z.string(),
    specId: z.string(),
  }),
);
export type LetterVariant = z.infer<typeof LetterVariantSchema>;

const EnvVarsSchema = z.object({
  LETTERS_TABLE_NAME: z.string(),
  LETTER_TTL_HOURS: z.coerce.number().int(),
  VARIANT_MAP: z.string().transform((str, _) => {
    const parsed = JSON.parse(str);
    return LetterVariantSchema.parse(parsed);
  }),
  PINO_LOG_LEVEL: z.coerce.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
