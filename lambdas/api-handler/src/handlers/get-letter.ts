import { APIGatewayProxyHandler } from "aws-lambda";
import { MetricsLogger, metricScope } from "aws-embedded-metrics";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import ValidationError from "../errors/validation-error";
import { ApiErrorDetail } from "../contracts/errors";
import { getLetterById } from "../services/letter-operations";
import { processError } from "../mappers/error-mapper";
import { mapToGetLetterResponse } from "../mappers/letter-mapper";
import { Deps } from "../config/deps";
import { MetricStatus, emitForSingleSupplier } from "../utils/metrics";

// Get letter data
export default function createGetLetterHandler(
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
      try {
        const letterId = assertNotEmpty(
          event.pathParameters?.id,
          new ValidationError(
            ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter,
          ),
        );

        const letter = await getLetterById(
          supplierId,
          letterId,
          deps.letterRepo,
        );

        const response = mapToGetLetterResponse(letter);

        deps.logger.info({
          description: "Letter successfully fetched by id",
          supplierId,
          letterId,
        });

        emitForSingleSupplier(
          metrics,
          "getLetter",
          supplierId,
          1,
          MetricStatus.Success,
        );
        return {
          statusCode: 200,
          body: JSON.stringify(response),
        };
      } catch (error) {
        emitForSingleSupplier(
          metrics,
          "getLetter",
          supplierId,
          1,
          MetricStatus.Failure,
        );
        return processError(error, commonIds.value.correlationId, deps.logger);
      }
    };
  });
}
