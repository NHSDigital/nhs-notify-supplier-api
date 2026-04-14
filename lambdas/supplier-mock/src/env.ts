import { z } from "zod";

const EnvVarsSchema = z.object({
  PINO_LOG_LEVEL: z.coerce.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars: EnvVars = EnvVarsSchema.parse(process.env);
