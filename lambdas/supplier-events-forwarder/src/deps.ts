import pino from "pino";
import { FirehoseClient } from "@aws-sdk/client-firehose";
import { envVars } from "./env";

export type Deps = {
  firehoseClient: FirehoseClient;
  deliveryStreamName: string;
  logger: pino.Logger;
};

export function createDependenciesContainer(): Deps {
  const log = pino();

  return {
    firehoseClient: new FirehoseClient(),
    deliveryStreamName: envVars.FIREHOSE_DELIVERY_STREAM_NAME,
    logger: log,
  };
}
