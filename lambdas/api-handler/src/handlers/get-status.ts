import { APIGatewayProxyHandler } from "aws-lambda";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { Deps } from "../config/deps";
import LogRefs from "../config/log-references";

async function s3HealthCheck(s3Client: S3Client) {
  const command: ListBucketsCommand = new ListBucketsCommand({
    MaxBuckets: 1,
  });
  await s3Client.send(command);
}

export default function createGetStatusHandler(
  deps: Deps,
): APIGatewayProxyHandler {
  return async (_) => {
    try {
      await deps.dbHealthcheck.check();
      await s3HealthCheck(deps.s3Client);

      deps.logger.info({
        logRef: LogRefs.HEALTHCHECK_PASSED.code,
        description: LogRefs.HEALTHCHECK_PASSED.description,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ code: 200 }, null, 2),
      };
    } catch (error) {
      deps.logger.error({
        logRef: LogRefs.STATUS_ENDPOINT_ERROR.code,
        description: LogRefs.STATUS_ENDPOINT_ERROR.description,
        err: error,
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ code: 500 }, null, 2),
      };
    }
  };
}
