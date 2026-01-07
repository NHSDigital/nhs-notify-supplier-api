import { z } from "zod";

const EnvVarsSchema = z.object({
  QUEUE_URL: z.coerce.string(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
