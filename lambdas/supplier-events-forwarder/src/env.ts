import { z } from "zod";

const EnvVarsSchema = z.object({
  FIREHOSE_DELIVERY_STREAM_NAME: z.coerce.string(),
});

export type EnvVars = z.infer<typeof EnvVarsSchema>;

export const envVars = EnvVarsSchema.parse(process.env);
