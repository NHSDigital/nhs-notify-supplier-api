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

export enum MetricStatus {
  Success = "success",
  Failure = "failure",
}

export interface MetricEntry {
  key: string;
  value: number;
  unit: Unit;
}

// build EMF object
export function buildEMFObject(
  functionName: string,
  dimensions: Record<string, string>,
  metric: MetricEntry,
) {
  const namespace = process.env.AWS_LAMBDA_FUNCTION_NAME || functionName;
  return {
    LogGroup: namespace,
    ServiceName: namespace,
    ...dimensions,
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: namespace,
          Dimensions: [[...Object.keys(dimensions), "ServiceName", "LogGroup"]],
          Metrics: [
            { Name: metric.key, Value: metric.value, Unit: metric.unit },
          ],
        },
      ],
    },
    [metric.key]: metric.value,
  };
}
