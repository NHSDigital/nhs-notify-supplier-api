import { APIGatewayProxyHandler } from "aws-lambda";
import { Deps } from "../config/deps";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { validateCommonHeaders } from "../utils/validation";
import { mapErrorToResponse } from "../mappers/error-mapper";

export function createGetStatusHandler(deps: Deps): APIGatewayProxyHandler {

  return async(event) => {

    const commonHeadersResult = validateCommonHeaders(event.headers, deps);

    if (!commonHeadersResult.ok) {
      return mapErrorToResponse(commonHeadersResult.error, commonHeadersResult.correlationId, deps.logger);
    }

    try {
      await deps.dbHealthcheck.check();
      await s3HealthCheck(deps.s3Client);

      deps.logger.info({
        description: 'Healthcheck passed',
        supplierId: commonHeadersResult.value.supplierId
      });

      return {
        statusCode: 200,
        body: '{}'
      };
    } catch (error) {
      return mapErrorToResponse(error, commonHeadersResult.value.correlationId, deps.logger);
    }
  }
}


async function s3HealthCheck(s3Client: S3Client) {
  const command: ListBucketsCommand = new ListBucketsCommand({
    MaxBuckets: 1
  });
  await s3Client.send(command);
}
