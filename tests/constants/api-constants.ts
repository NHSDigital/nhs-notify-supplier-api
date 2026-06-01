export const SUPPLIER_LETTERS = "letters";
export const SUPPLIER_API_URL_SANDBOX =
  "https://internal-dev-sandbox.api.service.nhs.uk/nhs-notify-supplier";
export const AWS_REGION = "eu-west-2";
export const envName = process.env.TARGET_ENVIRONMENT ?? "main";
export const API_NAME = `nhs-${envName}-supapi`;
export const LETTERSTABLENAME = `nhs-${envName}-supapi-letters`;
export const SUPPLIERID = "supplier1";
export const MI_ENDPOINT = "mi";
export const SUPPLIERTABLENAME = `nhs-${envName}-supapi-suppliers`;
export const DATA = "data";
export const EVENT_SUBSCRIPTION_TOPIC_NAME = `nhs-${envName}-supapi-eventsub`;

export const DEFAULT_TARGET_ACCOUNT_GROUP = "nhs-notify-supplier-api-dev";
export const PROD_TARGET_ACCOUNT_GROUP = "nhs-notify-supplier-api-prod";
export const TARGET_ACCOUNT_GROUP =
  process.env.TARGET_ACCOUNT_GROUP ?? DEFAULT_TARGET_ACCOUNT_GROUP;

export const ACCOUNT_GROUP_TO_AWS_ACCOUNT_ID = new Map<string, string>([
  ["nhs-notify-supplier-api-dev", "820178564574"],
  ["nhs-notify-supplier-api-nonprod", "885964308133"],
]);

function resolveAwsAccountId(): string {
  if (TARGET_ACCOUNT_GROUP === PROD_TARGET_ACCOUNT_GROUP) {
    throw new Error(
      `TARGET_ACCOUNT_GROUP='${TARGET_ACCOUNT_GROUP}' points to production. Test execution against production is blocked.`,
    );
  }

  const mappedAccountId =
    ACCOUNT_GROUP_TO_AWS_ACCOUNT_ID.get(TARGET_ACCOUNT_GROUP);
  if (mappedAccountId) {
    return mappedAccountId;
  }

  throw new Error(
    `No AWS account mapping configured for TARGET_ACCOUNT_GROUP='${TARGET_ACCOUNT_GROUP}'. Add a mapping in tests/constants/api-constants.ts.`,
  );
}

export const AWS_ACCOUNT_ID = resolveAwsAccountId();
export const UPSERT_LETTER_LAMBDA_ARN = `arn:aws:lambda:eu-west-2:${AWS_ACCOUNT_ID}:function:nhs-${envName}-supapi-upsertletter`;
export const EVENT_SUBSCRIPTION_TOPIC_ARN =
  process.env.EVENT_SUBSCRIPTION_TOPIC_ARN ??
  `arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${EVENT_SUBSCRIPTION_TOPIC_NAME}`;
export const LETTERQUEUE_TABLENAME = `nhs-${envName}-supapi-letter-queue`;
export const GET_LETTERS_MAX_RETRIES = 3;
export const DEV_VISIBILITY_TIMEOUT_SECONDS = 10;
export const DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 300;
export const VISIBILITY_TIMEOUT_SECONDS =
  TARGET_ACCOUNT_GROUP === DEFAULT_TARGET_ACCOUNT_GROUP
    ? DEV_VISIBILITY_TIMEOUT_SECONDS
    : DEFAULT_VISIBILITY_TIMEOUT_SECONDS;
