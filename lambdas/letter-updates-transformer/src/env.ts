import { z } from "zod";

const EnvVarsSchema = z.object({
  EVENTPUB_SNS_TOPIC_ARN: z.string(),
  EVENT_SOURCE: z.string(),
  PINO_LOG_LEVEL: z.coerce.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
