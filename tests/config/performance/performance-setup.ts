import fs from "node:fs";
import path from "node:path";
import { envName } from "tests/constants/api-constants";
import { getLambdaEnv, updateLambdaEnv } from "tests/helpers/aws-lambda-helper";
import { logger } from "tests/helpers/pino-logger";

const ORIGINAL_ENV = path.join(__dirname, ".lambda-env.json");
const UPSERT_LETTER_LAMBDA_ARN = `arn:aws:lambda:eu-west-2:820178564574:function:nhs-${envName}-supapi-upsertletter`;

export default async function performanceSetup() {
  const currentEnv = await getLambdaEnv(UPSERT_LETTER_LAMBDA_ARN);
  if (Object.keys(currentEnv).length === 0) {
    return;
  }

  // Persist original env for teardown
  fs.writeFileSync(ORIGINAL_ENV, JSON.stringify(currentEnv, null, 2));

  await updateLambdaEnv(UPSERT_LETTER_LAMBDA_ARN, {
    ...currentEnv,
    LETTER_TTL_HOURS: "1",
  });

  logger.info("LETTER_TTL_HOURS set to 1");
}
