import { z } from "zod";

const EnvVarsSchema = z.object({
  LETTERS_TABLE_NAME: z.string(),
  LETTER_TTL_HOURS: z.coerce.number().int(),
  PINO_LOG_LEVEL: z.coerce.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
