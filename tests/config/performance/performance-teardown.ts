import fs from "node:fs";
import { UPSERT_LETTER_LAMBDA_ARN } from "tests/constants/api-constants";
import { updateLambdaEnv } from "tests/helpers/aws-lambda-helper";
import path from "node:path";
import { logger } from "tests/helpers/pino-logger";

const ORIGINAL_ENV = path.join(
  __dirname,
  "..",
  "..",
  "resources",
  "lambda-env.json",
);

export default async function performanceTeardown() {
  try {
    if (!fs.existsSync(ORIGINAL_ENV)) {
      throw new Error(`Teardown failed: original Lambda env file not found at ${ORIGINAL_ENV}, so the Lambda environment was NOT restored.
      Either run the test again, or manually set the Original Lambda environment (default LETTER_TLL_HOURS=12960)`);
    }

    const originalEnv = JSON.parse(fs.readFileSync(ORIGINAL_ENV, "utf8"));

    const response = await updateLambdaEnv(
      UPSERT_LETTER_LAMBDA_ARN,
      originalEnv,
    );
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(`Teardown failed: with code: ${response.$metadata.httpStatusCode}, while updating Lambda configuration environment from the file ${ORIGINAL_ENV} for function ${UPSERT_LETTER_LAMBDA_ARN}
      Either run the test again, or update the configuration manually.`);
    }

    fs.unlinkSync(ORIGINAL_ENV);
    logger.info("Original value of LETTER_TTL_HOURS restored");
  } catch (error) {
    throw new Error(`Performance tests teardown failed with error: ${error}`);
  }
}
