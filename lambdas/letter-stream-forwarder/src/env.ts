import { z } from 'zod';

const EnvVarsSchema = z.object({
  LETTER_CHANGE_STREAM_ARN: z.string(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
