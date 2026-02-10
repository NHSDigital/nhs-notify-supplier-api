import { APIGatewayProxyHandler } from "aws-lambda";
import { MetricsLogger, metricScope } from "aws-embedded-metrics";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { ApiErrorDetail } from "../contracts/errors";
import { processError } from "../mappers/error-mapper";
import ValidationError from "../errors/validation-error";
import { getLetterDataUrl } from "../services/letter-operations";
import type { Deps } from "../config/deps";
import { MetricStatus, emitForSingleSupplier } from "../utils/metrics";

export default function createGetLetterDataHandler(
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

        const presignedUrl = await getLetterDataUrl(supplierId, letterId, deps);

        deps.logger.info({
          description: "Generated presigned URL",
          supplierId,
          letterId,
          correlationId: commonIds.value.correlationId,
        });

        emitForSingleSupplier(
          metrics,
          "getLetterData",
          supplierId,
          1,
          MetricStatus.Success,
        );
        return {
          statusCode: 303,
          headers: {
            Location: presignedUrl,
          },
          body: "",
        };
      } catch (error) {
        emitForSingleSupplier(
          metrics,
          "getLetterData",
          supplierId,
          1,
          MetricStatus.Failure,
        );
        return processError(error, commonIds.value.correlationId, deps.logger);
      }
    };
  });
}
