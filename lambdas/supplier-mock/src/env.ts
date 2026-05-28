import { z } from "zod";

const EnvVarsSchema = z.object({
  PINO_LOG_LEVEL: z.coerce.string().optional(),
  ENVIRONMENT: z.string().optional(),
  AWS_REGION: z.string().optional(),
  GET_LETTERS_FUNCTION_NAME: z.string().optional(),
  PATCH_LETTER_FUNCTION_NAME: z.string().optional(),
  SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME: z.string().optional(),
  SUPPLIER_MOCK_SUPPLIER_ID: z.string().optional(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars: EnvVars = EnvVarsSchema.parse(process.env);
