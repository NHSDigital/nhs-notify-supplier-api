interface LambdaConfig {
  SUPPLIER_ID_HEADER: string;
  APIM_CORRELATION_HEADER: string;
}

export const lambdaConfig: LambdaConfig = {
  SUPPLIER_ID_HEADER: getEnv("SUPPLIER_ID_HEADER")!,
  APIM_CORRELATION_HEADER: getEnv("APIM_CORRELATION_HEADER")!
};

function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
