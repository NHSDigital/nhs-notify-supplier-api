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
  PINO_LOG_LEVEL: z.coerce.string().optional(),
  VARIANT_MAP: z.string().transform((str, _) => {
    const parsed = JSON.parse(str);
    return LetterVariantSchema.parse(parsed);
  }),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
