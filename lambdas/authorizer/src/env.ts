import {z} from 'zod';

const EnvVarsSchema = z.object({
  CLOUDWATCH_NAMESPACE: z.string(),
  CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS: z.coerce.number().int()
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
