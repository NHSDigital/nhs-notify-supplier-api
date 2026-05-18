import type { SQSEvent, SQSRecord } from "aws-lambda";
import createSupplierConfigIngressHandler from "../handler/supplier-config-ingress-handler";
import { Deps } from "../config/deps";

function createSqsRecord(
  messageId: string,
  type: string,
  data: Record<string, unknown>,
): SQSRecord {
  const snsMessage = {
    Message: JSON.stringify({ type, data }),
  };
  return {
    messageId,
    body: JSON.stringify(snsMessage),
  } as unknown as SQSRecord;
}

function createValidSupplierConfig() {
  return {
    id: "supplier-123",
    name: "Supplier supplier-123",
    channelType: "LETTER",
    dailyCapacity: 2000,
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
    const event = { Records: [] } as unknown as SQSEvent;

    const result = await handler(event);

    expect(result).toEqual({ batchItemFailures: [] });
  });

  it("upserts supplier config from an SNS message in an SQS record", async () => {
    const data = createValidSupplierConfig();
    const record = createSqsRecord(
      "msg-1",
      "uk.nhs.notify.supplier-config.supplier",
      data,
    );
    const event = { Records: [record] } as unknown as SQSEvent;

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
    const record = createSqsRecord(
      "msg-fail",
      "uk.nhs.notify.supplier-config.supplier",
      { id: "supplier-123" },
    );
    const event = { Records: [record] } as unknown as SQSEvent;

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: "msg-fail" }],
    });
  });

  it("rejects a type field containing no dots", async () => {
    const data = createValidSupplierConfig();
    const record = createSqsRecord("msg-1", "look-no-dots", data);
    const event = { Records: [record] } as unknown as SQSEvent;

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: "msg-1" }],
    });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).not.toHaveBeenCalled();
  });

  it("rejects a type field not matching the name of any entity", async () => {
    const data = createValidSupplierConfig();
    const record = createSqsRecord(
      "msg-1",
      "uk.nhs.notify.supplier-config.suppler",
      data,
    );
    const event = { Records: [record] } as unknown as SQSEvent;

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: "msg-1" }],
    });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).not.toHaveBeenCalled();
  });

  it("rejects an entity not matching the appropriate schema", async () => {
    const data = createValidSupplierConfig();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dailyCapacity, ...invalidData } = data;
    const record = createSqsRecord(
      "msg-1",
      "uk.nhs.notify.supplier-config.supplier",
      invalidData,
    );
    const event = { Records: [record] } as unknown as SQSEvent;

    const result = await handler(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: "msg-1" }],
    });
    expect(
      mockDeps.supplierConfigRepo.upsertSupplierConfig,
    ).not.toHaveBeenCalled();
  });
});
