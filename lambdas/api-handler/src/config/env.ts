export interface LambdaEnv {
  SUPPLIER_ID_HEADER: string;
  APIM_CORRELATION_HEADER: string;
  LETTERS_TABLE_NAME: string;
  LETTER_TTL_HOURS: string;
  DOWNLOAD_URL_TTL_SECONDS: string;
}

export const lambdaEnv: LambdaEnv = {
  SUPPLIER_ID_HEADER: getEnv('SUPPLIER_ID_HEADER')!,
  APIM_CORRELATION_HEADER: getEnv('APIM_CORRELATION_HEADER')!,
  LETTERS_TABLE_NAME: getEnv('LETTERS_TABLE_NAME')!,
  LETTER_TTL_HOURS: getEnv('LETTER_TTL_HOURS')!,
  DOWNLOAD_URL_TTL_SECONDS: getEnv('DOWNLOAD_URL_TTL_SECONDS')!
};

function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
