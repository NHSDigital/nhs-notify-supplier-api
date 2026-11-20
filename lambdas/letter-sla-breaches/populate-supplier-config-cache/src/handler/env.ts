import { z } from "zod";

const EnvVarsSchema = z.object({
  SUPPLIER_CONFIG_TABLE_NAME: z.string(),
  EVENT_CACHE_BUCKET_NAME: z.string(),
  PINO_LOG_LEVEL: z.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
