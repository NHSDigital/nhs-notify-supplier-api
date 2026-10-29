import { z } from "zod";

const EnvVarsSchema = z.object({
  ATHENA_WORKGROUP: z.string(),
  ATHENA_DATABASE: z.string(),
  EVENT_CACHE_TABLE_NAME: z.string(),
  PACK_SPECIFICATION_TABLE_NAME: z.string(),
  DAYS_TO_LOOK_BACK: z.coerce.number().int().positive(),
  STANDARD_SLA_WORKING_DAYS: z.coerce.number().int().positive(),
  BANK_HOLIDAY_JSON_URL: z.url(),
  PINO_LOG_LEVEL: z.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

// Parsed on demand rather than at import so that importing this package
// (e.g. when automocked in tests) doesn't require the environment to be set
export const parseEnvVars = (env: NodeJS.ProcessEnv): EnvVars =>
  EnvVarsSchema.parse(env);
