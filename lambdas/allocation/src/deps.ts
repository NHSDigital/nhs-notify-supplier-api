import pino from "pino";
import { SQSClient } from "@aws-sdk/client-sqs";
import { envVars } from "./env";

export type Deps = {
  sqsClient: SQSClient;
  queueUrl: string;
  logger: pino.Logger;
};

export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    sqsClient: new SQSClient(),
    queueUrl: envVars.QUEUE_URL,
    logger: log,
  };
}
