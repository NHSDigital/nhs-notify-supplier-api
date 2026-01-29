import { MetricsLogger, Unit } from "aws-embedded-metrics";

export function emitForSingleSupplier(
  metrics: MetricsLogger,
  functionName: string,
  supplierId: string,
  count: number,
  message: string,
  dimensions?: Record<string, string>,
) {
  metrics.setNamespace(process.env.AWS_LAMBDA_FUNCTION_NAME || functionName);
  metrics.putDimensions({
    ...dimensions,
    Supplier: supplierId,
  });
  metrics.putMetric(message, count, Unit.Count);
}

export declare enum MetricStatus {
  Success = "success",
  Failure = "failure",
}
