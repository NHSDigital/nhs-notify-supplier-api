import { APIGatewayProxyHandler } from "aws-lambda";
import { MetricsLogger, Unit, metricScope } from "aws-embedded-metrics";
import type { Deps } from "../config/deps";
import { ApiErrorDetail } from "../contracts/errors";
import {
  PostLettersRequest,
  PostLettersRequestSchema,
  UpdateLetterCommand,
} from "../contracts/letters";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { mapToUpdateCommands } from "../mappers/letter-mapper";
import { enqueueLetterUpdateRequests } from "../services/letter-operations";
import { extractCommonIds } from "../utils/common-ids";
import { assertNotEmpty, requireEnvVar } from "../utils/validation";
import { MetricStatus } from "../utils/metrics";

function duplicateIdsExist(postLettersRequest: PostLettersRequest) {
  const ids = postLettersRequest.data.map((item) => item.id);
  return new Set(ids).size !== ids.length;
}

/**
 * emits metrics of successful letter updates, including the supplier and grouped by status
 */
function emitMetics(
  metrics: MetricsLogger,
  supplierId: string,
  statusesMapping: Map<string, number>,
) {
  for (const [status, count] of statusesMapping) {
    metrics.putDimensions({
      supplier: supplierId,
      eventType: status,
    });
    metrics.putMetric(MetricStatus.Success, count, Unit.Count);
  }
}

function populateStatusesMap(updateLetterCommands: UpdateLetterCommand[]) {
  const statusMap = new Map<string, number>();
  for (const command of updateLetterCommands) {
    statusMap.set(command.status, (statusMap.get(command.status) || 0) + 1);
  }
  return statusMap;
}

export default function createPostLettersHandler(
  deps: Deps,
): APIGatewayProxyHandler {
  return metricScope((metrics: MetricsLogger) => {
    return async (event) => {
      const commonIds = extractCommonIds(
        event.headers,
        event.requestContext,
        deps,
      );

      if (!commonIds.ok) {
        return processError(
          commonIds.error,
          commonIds.correlationId,
          deps.logger,
        );
      }

      const maxUpdateItems = requireEnvVar(deps.env, "MAX_LIMIT");
      requireEnvVar(deps.env, "QUEUE_URL");

      const { supplierId } = commonIds.value;
      metrics.setNamespace(
        process.env.AWS_LAMBDA_FUNCTION_NAME || "postLetters",
      );
      try {
        const body = assertNotEmpty(
          event.body,
          new ValidationError(ApiErrorDetail.InvalidRequestMissingBody),
        );

        let postLettersRequest: PostLettersRequest;

        try {
          postLettersRequest = PostLettersRequestSchema.parse(JSON.parse(body));
        } catch (error) {
          const typedError =
            error instanceof Error
              ? new ValidationError(ApiErrorDetail.InvalidRequestBody, {
                  cause: error,
                })
              : error;
          throw typedError;
        }

        deps.logger.info({
          description: "Received post letters request",
          supplierId: commonIds.value.supplierId,
          letterIds: postLettersRequest.data.map((letter) => letter.id),
          correlationId: commonIds.value.correlationId,
        });

        if (postLettersRequest.data.length > maxUpdateItems) {
          throw new ValidationError(
            ApiErrorDetail.InvalidRequestLettersToUpdate,
            { args: [maxUpdateItems] },
          );
        }

        if (duplicateIdsExist(postLettersRequest)) {
          throw new ValidationError(
            ApiErrorDetail.InvalidRequestDuplicateLetterId,
          );
        }

        const updateLetterCommands: UpdateLetterCommand[] = mapToUpdateCommands(
          postLettersRequest,
          supplierId,
        );
        const statusesMapping = populateStatusesMap(updateLetterCommands);
        await enqueueLetterUpdateRequests(
          updateLetterCommands,
          commonIds.value.correlationId,
          deps,
        );

        emitMetics(metrics, supplierId, statusesMapping);
        return {
          statusCode: 202,
          body: "",
        };
      } catch (error) {
        metrics.putDimensions({
          supplier: supplierId,
        });
        metrics.putMetric(MetricStatus.Failure, 1, Unit.Count);
        return processError(error, commonIds.value.correlationId, deps.logger);
      }
    };
  });
}
