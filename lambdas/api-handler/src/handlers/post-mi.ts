import { APIGatewayProxyHandler } from "aws-lambda";
import { Unit } from "aws-embedded-metrics";
import pino from "pino";
import postMIOperation from "../services/mi-operations";
import { ApiErrorDetail } from "../contracts/errors";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { assertNotEmpty, validateIso8601Timestamp } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { PostMIRequest, PostMIRequestSchema } from "../contracts/mi";
import { mapToMI } from "../mappers/mi-mapper";
import { Deps } from "../config/deps";
import { MetricEntry, MetricStatus, buildEMFObject } from "../utils/metrics";

export default function createPostMIHandler(
  deps: Deps,
): APIGatewayProxyHandler {
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
        emitErrorMetric(supplierId, deps.logger);
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

      deps.logger.info({
        description: "Posted management information",
        supplierId: commonIds.value.supplierId,
        correlationId: commonIds.value.correlationId,
      });

      // metric with count 1 specifying the supplier
      const dimensions: Record<string, string> = { supplier: supplierId };
      const metric: MetricEntry = {
        key: MetricStatus.Success,
        value: 1,
        unit: Unit.Count,
      };
      let emf = buildEMFObject("postMi", dimensions, metric);
      deps.logger.info(emf);

      // metric displaying the type/number of lineItems posted per supplier
      dimensions.lineItem = postMIRequest.data.attributes.lineItem;
      metric.key = "LineItem per supplier";
      emf = buildEMFObject("postMi", dimensions, metric);
      deps.logger.info(emf);

      return {
        statusCode: 201,
        body: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      emitErrorMetric(supplierId, deps.logger);
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
}

function emitErrorMetric(supplierId: string, logger: pino.Logger) {
  const dimensions: Record<string, string> = { supplier: supplierId };
  const metric: MetricEntry = {
    key: MetricStatus.Failure,
    value: 1,
    unit: Unit.Count,
  };
  const emf = buildEMFObject("postMi", dimensions, metric);
  logger.info(emf);
}
