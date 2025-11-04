import {z} from 'zod';

const EnvVarsSchema = z.object({
  SUPPLIERS_TABLE_NAME: z.string(),
  CLOUDWATCH_NAMESPACE: z.string(),
  APIM_APPLICATION_ID_HEADER: z.string(),
  CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS: z.coerce.number().int()
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
