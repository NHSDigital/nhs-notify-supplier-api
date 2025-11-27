import { z } from 'zod';

const EnvVarsSchema = z.object({
  MI_CHANGE_STREAM_NAME: z.string(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
