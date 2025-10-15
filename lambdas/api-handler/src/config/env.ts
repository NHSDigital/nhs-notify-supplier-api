import {z} from 'zod';

const EnvVarsSchema = z.object({
  SUPPLIER_ID_HEADER: z.string(),
  APIM_CORRELATION_HEADER: z.string(),
  LETTERS_TABLE_NAME: z.string(),
  MI_TABLE_NAME: z.string(),
  LETTER_TTL_HOURS: z.coerce.number().int(),
  DOWNLOAD_URL_TTL_SECONDS: z.coerce.number().int(),
  MAX_LIMIT: z.coerce.number().int().optional()
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
