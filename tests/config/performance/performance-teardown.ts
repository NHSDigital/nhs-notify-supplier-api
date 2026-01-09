import fs from "node:fs";
import { envName } from "tests/constants/api-constants";
import { updateLambdaEnv } from "tests/helpers/aws-lambda-helper";
import path from "node:path";
import { logger } from "tests/helpers/pino-logger";

const ORIGINAL_ENV = path.join(__dirname, ".lambda-env.json");
const UPSERT_LETTER_LAMBDA_ARN = `arn:aws:lambda:eu-west-2:820178564574:function:nhs-${envName}-supapi-upsertletter`;

export default async function performanceTeardown() {
  if (!fs.existsSync(ORIGINAL_ENV)) {
    return;
  }

  const originalEnv = JSON.parse(fs.readFileSync(ORIGINAL_ENV, "utf-8"));

  await updateLambdaEnv(UPSERT_LETTER_LAMBDA_ARN, originalEnv);
  fs.unlinkSync(ORIGINAL_ENV);

  logger.info("Original value of LETTER_TTL_HOURS restored");
}
