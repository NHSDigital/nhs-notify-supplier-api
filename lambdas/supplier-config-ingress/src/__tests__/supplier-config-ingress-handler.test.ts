import type { SQSRecord } from "aws-lambda";
import { Unit } from "aws-embedded-metrics";
import { MetricStatus } from "@internal/helpers";
import createSupplierConfigIngressHandler from "../handler/supplier-config-ingress-handler";
import { Deps } from "../config/deps";

function createSqsRecord(
  data: Record<string, unknown>,
  type = "uk.nhs.notify.supplier-config.supplier",
): SQSRecord {
  return {
    messageId: "msg-1",
    body: JSON.stringify({ type, data }),
  } as unknown as SQSRecord;
}

function createSupplierConfig(overrides: Record<string, any> = {}) {
  return {
    id: "supplier-1",
    name: "Supplier 1",
    channelType: "LETTER",
    dailyCapacity: 2000,
    status: "PROD",
    ...overrides,
  };
}

function createSupplierPackConfig() {
  return {
    id: "supplier1-client1-campaign",
    packSpecificationId: "client-1-campaign",
    supplierId: "supplier1",
    approval: "APPROVED",
    status: "PROD",
  };
}

describe("supplierConfigHandler", () => {
  let mockDeps: Deps;
  let handler: ReturnType<typeof createSupplierConfigIngressHandler>;

  beforeEach(() => {
    mockDeps = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      } as unknown as Deps["logger"],
      supplierConfigRepo: {
        upsertSupplierConfig: jest.fn().mockResolvedValue("CREATED"),
      } as unknown as Deps["supplierConfigRepo"],
      env: { SUPPLIER_CONFIG_TABLE_NAME: "test-table" },
    };
    handler = createSupplierConfigIngressHandler(mockDeps);
  });

  it("returns an empty batchItemFailures list when there are no records", async () => {
    const event = { Records: [] };

    const result = await handler(event);

    expect(result).toEqual({ batchItemFailures: [] });
  });

  it("upserts supplier config from an SNS message in an SQS record", async () => {
    const data = createSupplierConfig();
    const record = createSqsRecord(data);
    const event = { Records: [record] };

    const result = await handler(event);

    expect(result).toEqual({ batchItemFailures: [] });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).toHaveBeenCalledWith("supplier", data);
  });

  it("reports failed records in batchItemFailures", async () => {
    (
      mockDeps.supplierConfigRepo.upsertSupplierConfig as jest.Mock
    ).mockRejectedValue(new Error("DynamoDB error"));
    const data = createSupplierConfig();
    const record = createSqsRecord(data);
    const event = { Records: [record] };

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: record.messageId }],
    });
  });

  it("rejects a type field containing no dots", async () => {
    const data = createSupplierConfig();
    const record = createSqsRecord(data, "look-no-dots");
    const event = { Records: [record] };

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: record.messageId }],
    });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).not.toHaveBeenCalled();
  });

  it("rejects a type field not matching the name of any entity", async () => {
    const data = createSupplierConfig();
    const record = createSqsRecord(
      data,
      "uk.nhs.notify.supplier-config.suppler",
    );
    const event = { Records: [record] };

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: record.messageId }],
    });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).not.toHaveBeenCalled();
  });

  it("accepts a type field ending in a status and version", async () => {
    const data = createSupplierPackConfig();
    const record = createSqsRecord(
      data,
      "uk.nhs.notify.supplier-config.supplier-pack.prod.v1",
    );
    const event = { Records: [record] };

    const result = await handler(event);

    expect(result).toEqual({ batchItemFailures: [] });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).toHaveBeenCalledWith("supplier-pack", data);
  });

  it("rejects an entity not matching the appropriate schema", async () => {
    const invalidData = createSupplierConfig({ dailyCapacity: undefined });
    const record = createSqsRecord(invalidData);
    const event = { Records: [record] };

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: record.messageId }],
    });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).not.toHaveBeenCalled();
  });

  it("emits a success metric for a created config event", async () => {
    const data = createSupplierConfig();
    const record = createSqsRecord(data);
    const event = { Records: [record] };

    await handler(event);

    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "supplier",
        result: "CREATED",
        [MetricStatus.Success]: 1,
        _aws: expect.objectContaining({
          CloudWatchMetrics: expect.arrayContaining([
            expect.objectContaining({
              Metrics: [
                expect.objectContaining({
                  Name: MetricStatus.Success,
                  Value: 1,
                  Unit: Unit.Count,
                }),
              ],
            }),
          ]),
        }),
      }),
    );
  });

  it("emits a success metric for an updated config event", async () => {
    (
      mockDeps.supplierConfigRepo.upsertSupplierConfig as jest.Mock
    ).mockResolvedValue("UPDATED");
    const data = createSupplierConfig();
    const record = createSqsRecord(data);
    const event = { Records: [record] };

    await handler(event);

    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "supplier",
        result: "UPDATED",
        [MetricStatus.Success]: 1,
        _aws: expect.objectContaining({
          CloudWatchMetrics: expect.arrayContaining([
            expect.objectContaining({
              Metrics: [
                expect.objectContaining({
                  Name: MetricStatus.Success,
                  Value: 1,
                  Unit: Unit.Count,
                }),
              ],
            }),
          ]),
        }),
      }),
    );
  });

  it("emits a failure metric for failed records", async () => {
    (
      mockDeps.supplierConfigRepo.upsertSupplierConfig as jest.Mock
    ).mockRejectedValue(new Error("DynamoDB error"));
    const data = createSupplierConfig();
    const record = createSqsRecord(data);
    const event = { Records: [record] };

    await handler(event);

    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "supplier",
        [MetricStatus.Failure]: 1,
        _aws: expect.objectContaining({
          CloudWatchMetrics: expect.arrayContaining([
            expect.objectContaining({
              Metrics: [
                expect.objectContaining({
                  Name: MetricStatus.Failure,
                  Value: 1,
                  Unit: Unit.Count,
                }),
              ],
            }),
          ]),
        }),
      }),
    );
  });
});
