import { APIGatewayProxyHandler } from "aws-lambda";
import { Deps } from "../config/deps";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { mapErrorToResponse } from "../mappers/error-mapper";

export function createGetStatusHandler(deps: Deps): APIGatewayProxyHandler {

  return async(event) => {

    const correlationId = Object.entries(event.headers)
      .find(([headerName, _]) => headerName.toLowerCase() === deps.env.APIM_CORRELATION_HEADER)?.[1];

    try {
      await deps.dbHealthcheck.check();
      await s3HealthCheck(deps.s3Client);

      deps.logger.info({
        description: 'Healthcheck passed',
        correlationId
      });

      return {
        statusCode: 200,
        body: '{}'
      };
    } catch (error) {
      return mapErrorToResponse(error, correlationId || '', deps.logger);
    }
  }
}


async function s3HealthCheck(s3Client: S3Client) {
  const command: ListBucketsCommand = new ListBucketsCommand({
    MaxBuckets: 1
  });
  await s3Client.send(command);
}
