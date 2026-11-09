import { z } from "zod";

const EnvVarsSchema = z.object({
  PINO_LOG_LEVEL: z.coerce.string().optional(),
  LOG_REFERENCE: z.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
