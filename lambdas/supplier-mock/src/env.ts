import { z } from "zod";

const EnvVarsSchema = z.object({
  PINO_LOG_LEVEL: z.coerce.string().optional(),
  ENVIRONMENT: z.string().optional(),
  AWS_REGION: z.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars: EnvVars = EnvVarsSchema.parse(process.env);
