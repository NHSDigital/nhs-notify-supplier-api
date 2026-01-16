import fs from "node:fs";
import path from "node:path";
import { UPSERT_LETTER_LAMBDA_ARN } from "tests/constants/api-constants";
import { getLambdaEnv, updateLambdaEnv } from "tests/helpers/aws-lambda-helper";
import { logger } from "tests/helpers/pino-logger";

const ORIGINAL_ENV = path.join(
  __dirname,
  "..",
  "..",
  "resources",
  "lambda-env.json",
);

export default async function performanceSetup() {
  try {
    const currentEnv = await getLambdaEnv(UPSERT_LETTER_LAMBDA_ARN);
    if (Object.keys(currentEnv).length === 0) {
      throw new Error(
        `unable to obtain configuration environment for Lambda function ${UPSERT_LETTER_LAMBDA_ARN}. Exiting performance-setup`,
      );
    }

    // Persist original env for teardown
    fs.writeFileSync(ORIGINAL_ENV, JSON.stringify(currentEnv, null, 2));

    // if original env not persisted throw error, as we can't restore the env during teardown
    if (!fs.existsSync(ORIGINAL_ENV)) {
      throw new Error(`Setup failed: original Lambda env was not persisted at ${ORIGINAL_ENV}, so the Lambda environment was NOT stored.
      Try running the test again`);
    }

    await updateLambdaEnv(UPSERT_LETTER_LAMBDA_ARN, {
      ...currentEnv,
      LETTER_TTL_HOURS: "1",
    });

    logger.info("LETTER_TTL_HOURS set to 1");
  } catch (error) {
    throw new Error(`Performance tests setup failed with error: ${error}`);
  }
}
