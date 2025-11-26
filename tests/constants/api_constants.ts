export const SUPPLIER_LETTERS = 'letters';
export const AWS_REGION = 'eu-west-2';
export const envName = process.env.PR_NUMBER ?? 'main';
export const API_NAME = `nhs-${envName}-supapi`;
export const LETTERSTABLENAME = `nhs-${envName}-supapi-letters`;
export const SUPPLIERID = 'TestSupplier1';
export const MI_ENDPOINT = 'mi';

const formattedPr = process.env.PR_NUMBER
  ? process.env.PR_NUMBER.replace(/^pr(\d+)$/i, "PR-$1")
  : null;

// Build sandbox environment name
const sandboxEnv = formattedPr
  ? `nhs-notify-supplier-${formattedPr}`
  : "nhs-notify-supplier";
export const SUPPLIER_API_URL_SANDBOX = `https://internal-dev-sandbox.api.service.nhs.uk/${sandboxEnv}`;
