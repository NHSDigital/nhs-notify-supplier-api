// Replace me with the actual code for your Lambda function
import { SQSEvent, SQSHandler } from "aws-lambda";
import pino from "pino";

const log = pino();

export const handler: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    log.info({ description: "Received event", message: record.body });
  }
};

export default handler;
