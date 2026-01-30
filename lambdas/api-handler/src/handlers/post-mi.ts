import { APIGatewayProxyHandler } from "aws-lambda";
import { MetricsLogger, metricScope } from "aws-embedded-metrics";
import postMIOperation from "../services/mi-operations";
import { ApiErrorDetail } from "../contracts/errors";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { assertNotEmpty, validateIso8601Timestamp } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { PostMIRequest, PostMIRequestSchema } from "../contracts/mi";
import { mapToMI } from "../mappers/mi-mapper";
import { Deps } from "../config/deps";
import { MetricStatus, emitForSingleSupplier } from "../utils/metrics";

export default function createPostMIHandler(
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
        const body = assertNotEmpty(
          event.body,
          new ValidationError(ApiErrorDetail.InvalidRequestMissingBody),
        );

        let postMIRequest: PostMIRequest;

        try {
          postMIRequest = PostMIRequestSchema.parse(JSON.parse(body));
        } catch (error) {
          const typedError =
            error instanceof Error
              ? new ValidationError(ApiErrorDetail.InvalidRequestBody, {
                  cause: error,
                })
              : error;
          throw typedError;
        }
        validateIso8601Timestamp(postMIRequest.data.attributes.timestamp);

        const result = await postMIOperation(
          mapToMI(postMIRequest, supplierId),
          deps.miRepo,
        );

        // metric with count 1 specifying the supplier
        emitForSingleSupplier(
          metrics,
          "postMi",
          supplierId,
          1,
          MetricStatus.Success,
        );
        // metric displaying the supplier and the type/number of lineItems posted
        emitForSingleSupplier(
          metrics,
          "postMi",
          supplierId,
          postMIRequest.data.attributes.quantity,
          MetricStatus.Success,
          { lineItem: postMIRequest.data.attributes.lineItem },
        );

        return {
          statusCode: 201,
          body: JSON.stringify(result, null, 2),
        };
      } catch (error) {
        emitForSingleSupplier(
          metrics,
          "postMi",
          supplierId,
          1,
          MetricStatus.Failure,
        );
        return processError(error, commonIds.value.correlationId, deps.logger);
      }
    };
  });
}
