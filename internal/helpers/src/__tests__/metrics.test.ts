import type { MetricsLogger } from "aws-embedded-metrics";
import { Unit } from "aws-embedded-metrics";
import {
  MetricStatus,
  buildEMFObject,
  emitForSingleSupplier,
} from "../metrics";

describe("emitForSingleSupplier", () => {
  const originalFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME;

  afterEach(() => {
    if (originalFunctionName === undefined) {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    } else {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalFunctionName;
    }
  });

  it("sets the function namespace, supplier dimensions, and count metric", () => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    const metrics = {
      setNamespace: jest.fn(),
      putDimensions: jest.fn(),
      putMetric: jest.fn(),
    } as unknown as MetricsLogger;

    emitForSingleSupplier(
      metrics,
      "process-letter",
      "supplier-1",
      3,
      MetricStatus.Success,
    );

    expect(metrics.setNamespace).toHaveBeenCalledWith("process-letter");
    expect(metrics.putDimensions).toHaveBeenCalledWith({
      Supplier: "supplier-1",
    });
    expect(metrics.putMetric).toHaveBeenCalledWith(
      MetricStatus.Success,
      3,
      Unit.Count,
    );
  });

  it("uses the Lambda function name and preserves additional dimensions", () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "lambda-function";
    const metrics = {
      setNamespace: jest.fn(),
      putDimensions: jest.fn(),
      putMetric: jest.fn(),
    } as unknown as MetricsLogger;

    emitForSingleSupplier(
      metrics,
      "fallback-function",
      "supplier-1",
      2,
      MetricStatus.Failure,
      { Environment: "test", Supplier: "overridden-supplier" },
    );

    expect(metrics.setNamespace).toHaveBeenCalledWith("lambda-function");
    expect(metrics.putDimensions).toHaveBeenCalledWith({
      Environment: "test",
      Supplier: "supplier-1",
    });
    expect(metrics.putMetric).toHaveBeenCalledWith(
      MetricStatus.Failure,
      2,
      Unit.Count,
    );
  });
});

describe("buildEMFObject", () => {
  const originalFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFunctionName === undefined) {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    } else {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalFunctionName;
    }
  });

  it("builds an EMF object using the supplied function name", () => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    jest.spyOn(Date, "now").mockReturnValue(123_456_789);

    expect(
      buildEMFObject(
        "process-letter",
        { Supplier: "supplier-1", Environment: "test" },
        { key: MetricStatus.Success, value: 1, unit: Unit.Count },
      ),
    ).toEqual({
      Supplier: "supplier-1",
      Environment: "test",
      _aws: {
        Timestamp: 123_456_789,
        CloudWatchMetrics: [
          {
            Namespace: "process-letter",
            Dimensions: [["Supplier", "Environment"]],
            Metrics: [
              {
                Name: MetricStatus.Success,
                Value: 1,
                Unit: Unit.Count,
              },
            ],
          },
        ],
      },
      [MetricStatus.Success]: 1,
    });
  });

  it("prefers the Lambda function name for the EMF namespace", () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "lambda-function";

    const emfObject = buildEMFObject(
      "fallback-function",
      { Supplier: "supplier-1" },
      { key: "BreachCount", value: 4, unit: Unit.Count },
    );

    expect(emfObject._aws.CloudWatchMetrics[0].Namespace).toBe(
      "lambda-function",
    );
  });

  it("uses the optional dimension sets if provided", () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "lambda-function";

    const emfObject = buildEMFObject(
      "process-letter",
      { Supplier: "supplier-1" },
      { key: "BreachCount", value: 4, unit: Unit.Count },
      [[], ["Supplier"]],
    );

    expect(emfObject._aws.CloudWatchMetrics[0].Dimensions).toEqual([
      [],
      ["Supplier"],
    ]);
  });
});
