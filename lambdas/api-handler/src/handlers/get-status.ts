import { APIGatewayProxyHandler } from "aws-lambda";
import { Deps } from "../config/deps";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { mapErrorToResponse } from "../mappers/error-mapper";

export function createGetStatusHandler(deps: Deps): APIGatewayProxyHandler {

  return async(_) => {

    try {
      await deps.dbHealthcheck.check();
      await s3HealthCheck(deps.s3Client);

      deps.logger.info({
        description: 'Healthcheck passed'
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ code: 200 }, null, 2)
      };
    } catch (error) {
      deps.logger.error({ err: error }, 'Status endpoint error, services not available');
      return {
        statusCode: 500,
        body: JSON.stringify({ code: 500 }, null, 2)
      };
    }
  }
}


async function s3HealthCheck(s3Client: S3Client) {
  const command: ListBucketsCommand = new ListBucketsCommand({
    MaxBuckets: 1
  });
  await s3Client.send(command);
}
