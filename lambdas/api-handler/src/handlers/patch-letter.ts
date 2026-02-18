import { APIGatewayProxyHandler } from "aws-lambda";
import { MetricsLogger, Unit, metricScope } from "aws-embedded-metrics";
import { enqueueLetterUpdateRequests } from "../services/letter-operations";
import {
  PatchLetterRequest,
  PatchLetterRequestSchema,
  UpdateLetterCommand,
} from "../contracts/letters";
import { ApiErrorDetail } from "../contracts/errors";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { mapToUpdateCommand } from "../mappers/letter-mapper";
import type { Deps } from "../config/deps";
import { MetricStatus } from "../utils/metrics";

export default function createPatchLetterHandler(
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

      const { supplierId } = commonIds.value;
      metrics.setNamespace(
        process.env.AWS_LAMBDA_FUNCTION_NAME || "patchLetters",
      );

      try {
        const letterId = assertNotEmpty(
          event.pathParameters?.id,
          new ValidationError(
            ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter,
          ),
        );
        const body = assertNotEmpty(
          event.body,
          new ValidationError(ApiErrorDetail.InvalidRequestMissingBody),
        );

        let patchLetterRequest: PatchLetterRequest;

        try {
          patchLetterRequest = PatchLetterRequestSchema.parse(JSON.parse(body));
        } catch (error) {
          emitErrorMetric(metrics, supplierId);
          const typedError =
            error instanceof Error
              ? new ValidationError(ApiErrorDetail.InvalidRequestBody, {
                  cause: error,
                })
              : error;
          throw typedError;
        }

        deps.logger.info({
          description: "Received patch letter request",
          supplierId: commonIds.value.supplierId,
          letterId,
          newStatus: patchLetterRequest.data.attributes.status,
          correlationId: commonIds.value.correlationId,
        });

        const updateLetterCommand: UpdateLetterCommand = mapToUpdateCommand(
          patchLetterRequest,
          supplierId,
        );

        if (updateLetterCommand.id !== letterId) {
          emitErrorMetric(metrics, supplierId);
          throw new ValidationError(
            ApiErrorDetail.InvalidRequestLetterIdsMismatch,
          );
        }

        await enqueueLetterUpdateRequests(
          [updateLetterCommand],
          commonIds.value.correlationId,
          deps,
        );

        metrics.putDimensions({
          supplier: supplierId,
          status: updateLetterCommand.status,
        });
        metrics.putMetric(MetricStatus.Success, 1, Unit.Count);
        return {
          statusCode: 202,
          body: "",
        };
      } catch (error) {
        emitErrorMetric(metrics, supplierId);
        return processError(error, commonIds.value.correlationId, deps.logger);
      }
    };
  });
}

function emitErrorMetric(metrics: MetricsLogger, supplierId: string) {
  metrics.putDimensions({
    supplier: supplierId,
  });
  metrics.putMetric(MetricStatus.Failure, 1, Unit.Count);
}
