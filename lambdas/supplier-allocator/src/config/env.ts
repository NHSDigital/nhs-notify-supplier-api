import { z } from "zod";

const EnvVarsSchema = z.object({
  SUPPLIER_CONFIG_TABLE_NAME: z.string(),
  SUPPLIER_QUOTAS_TABLE_NAME: z.string(),
  PINO_LOG_LEVEL: z.coerce.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
