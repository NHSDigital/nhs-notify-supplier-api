import { APIGatewayProxyHandler } from "aws-lambda";
import { Unit } from "aws-embedded-metrics";
import pino from "pino";
import { MetricEntry, MetricStatus, buildEMFObject } from "@internal/helpers";
import { getMI as getMIOperation } from "../services/mi-operations";
import { ApiErrorDetail } from "../contracts/errors";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { Deps } from "../config/deps";

export default function createGetMIHandler(deps: Deps): APIGatewayProxyHandler {
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
      const miId = assertNotEmpty(
        event.pathParameters?.id,
        new ValidationError(
          ApiErrorDetail.InvalidRequestMissingMiIdPathParameter,
        ),
      );

      const result = await getMIOperation(miId, supplierId, deps.miRepo);

      deps.logger.info({
        description: "Retrieved management information",
        supplierId: commonIds.value.supplierId,
        correlationId: commonIds.value.correlationId,
      });

      // metric with count 1 specifying the supplier
      const dimensions: Record<string, string> = { supplierId };
      emitMetric("getMi", dimensions, deps.logger, MetricStatus.Success, 1);

      // metric displaying the type/number of lineItems posted per supplier
      dimensions.lineItem = result.data.attributes.lineItem;
      emitMetric(
        "getMi",
        dimensions,
        deps.logger,
        "LineItem per supplier",
        result.data.attributes.quantity,
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      emitMetric(
        "getMi",
        { supplierId },
        deps.logger,
        MetricStatus.Failure,
        1,
      );
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
}

function emitMetric(source: string, dimensions: Record<string, string>, logger: pino.Logger, key: string, value: number){
  const metric: MetricEntry = {
    key,
    value,
    unit: Unit.Count,
  };
  const emf = buildEMFObject(source, dimensions, metric);
  logger.info(emf);
}
