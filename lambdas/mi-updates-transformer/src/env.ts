import {z} from 'zod';

const EnvVarsSchema = z.object({
  EVENT_PUB_SNS_TOPIC_ARN: z.string(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
