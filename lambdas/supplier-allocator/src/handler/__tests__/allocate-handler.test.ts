import { SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import createSupplierAllocatorHandler from "../allocate-handler";
import * as supplierConfig from "../../services/supplier-config";
import { Deps } from "../../config/deps";

jest.mock("@aws-sdk/client-sqs");
jest.mock("../../services/supplier-config");

function makeDeps(overrides: Partial<Deps> = {}): Deps {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const sqsClient = {
    send: jest.fn().mockResolvedValue({}),
  };

  const supplierConfigRepo = {
    getLetterVariant: jest.fn(),
    getVolumeGroup: jest.fn(),
    getSupplierAllocationsForVolumeGroup: jest.fn(),
  };

  const env = {
    VARIANT_MAP: {
      "variant-1": { supplierId: "supplier-1", specId: "spec-1" },
      "variant-2": { supplierId: "supplier-2", specId: "spec-2" },
    },
  };

  return {
    logger: logger as any,
    sqsClient: sqsClient as any,
    supplierConfigRepo: supplierConfigRepo as any,
    env: env as any,
    ...overrides,
  } as any;
}

function makeLetterEventV2(
  variantId = "variant-1",
): LetterRequestPreparedEventV2 {
  return {
    type: "uk.nhs.notify.letter-rendering.letter-request.prepared.v2",
    data: {
      letterVariantId: variantId,
      eventId: "event-123",
      timestamp: new Date().toISOString(),
    },
  } as any;
}

function makeSQSRecord(body: any): SQSRecord {
  return {
    messageId: "message-123",
    receiptHandle: "receipt-handle-123",
    body: JSON.stringify(body),
    attributes: {
      ApproximateReceiveCount: "1",
      SentTimestamp: Date.now().toString(),
      SenderId: "sender-123",
      ApproximateFirstReceiveTimestamp: Date.now().toString(),
    },
    messageAttributes: {},
    md5OfBody: "md5",
    eventSource: "aws:sqs",
    eventSourceARN: "arn:aws:sqs:region:account:queue",
    awsRegion: "us-east-1",
  } as any;
}

function setupDefaultMocks() {
  (supplierConfig.getVariantDetails as jest.Mock).mockResolvedValue({
    id: "v1",
    volumeGroupId: "g1",
  });
  (supplierConfig.getVolumeGroupDetails as jest.Mock).mockResolvedValue({
    id: "g1",
    status: "PROD",
  });
  (
    supplierConfig.getSupplierAllocationsForVolumeGroup as jest.Mock
  ).mockResolvedValue([{ supplier: "s1" }]);
  (supplierConfig.getSupplierDetails as jest.Mock).mockResolvedValue({
    supplierId: "supplier-1",
    specId: "spec-1",
  });
}

describe("allocate-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.queue";
  });

  afterEach(() => {
    delete process.env.UPSERT_LETTERS_QUEUE_URL;
  });

  describe("createSupplierAllocatorHandler", () => {
    it("creates a handler function", () => {
      const deps = makeDeps();
      const handler = createSupplierAllocatorHandler(deps);
      expect(handler).toBeInstanceOf(Function);
    });
  });

  describe("handler execution", () => {
    it("processes single record successfully", async () => {
      const deps = makeDeps();
      const letterEvent = makeLetterEventV2();

      setupDefaultMocks();

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [makeSQSRecord(letterEvent)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(0);
      expect(deps.sqsClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand),
      );
      expect(deps.logger.info).toHaveBeenCalled();
    });

    it("processes multiple records", async () => {
      const deps = makeDeps();
      const letterEvent1 = makeLetterEventV2("variant-1");
      const letterEvent2 = makeLetterEventV2("variant-2");

      setupDefaultMocks();

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [makeSQSRecord(letterEvent1), makeSQSRecord(letterEvent2)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(0);
      expect(deps.sqsClient.send).toHaveBeenCalledTimes(2);
    });

    it("records failures for invalid JSON", async () => {
      const deps = makeDeps();
      const handler = createSupplierAllocatorHandler(deps);

      const badRecord = makeSQSRecord("");
      badRecord.body = "invalid json {";

      const event: SQSEvent = {
        Records: [badRecord],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe("message-123");
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("records failures for invalid event type", async () => {
      const deps = makeDeps();
      const handler = createSupplierAllocatorHandler(deps);

      const invalidEvent = { type: "invalid.type" };
      const event: SQSEvent = {
        Records: [makeSQSRecord(invalidEvent)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("records failures for missing envelope type", async () => {
      const deps = makeDeps();
      const handler = createSupplierAllocatorHandler(deps);

      const invalidEvent = { data: { letterVariantId: "v1" } };
      const event: SQSEvent = {
        Records: [makeSQSRecord(invalidEvent)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("records failures for missing variant mapping", async () => {
      const deps = makeDeps();
      const letterEvent = makeLetterEventV2("unknown-variant");

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [makeSQSRecord(letterEvent)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(deps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Error processing allocation of record",
        }),
      );
    });

    it("records failures when supplier config resolution fails", async () => {
      const deps = makeDeps();
      const letterEvent = makeLetterEventV2();

      (supplierConfig.getVariantDetails as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [makeSQSRecord(letterEvent)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("records failures when UPSERT_LETTERS_QUEUE_URL not configured", async () => {
      delete process.env.UPSERT_LETTERS_QUEUE_URL;

      const deps = makeDeps();
      const letterEvent = makeLetterEventV2();

      setupDefaultMocks();

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [makeSQSRecord(letterEvent)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("records failures when SQS send fails", async () => {
      const deps = makeDeps();
      const letterEvent = makeLetterEventV2();

      setupDefaultMocks();

      deps.sqsClient.send = jest.fn().mockRejectedValue(new Error("SQS error"));

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [makeSQSRecord(letterEvent)],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(deps.logger.error).toHaveBeenCalled();
    });

    it("handles mixed success and failure records", async () => {
      const deps = makeDeps();
      const letterEventGood = makeLetterEventV2("variant-1");
      const letterEventBad = { type: "invalid.type" };

      setupDefaultMocks();

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [
          makeSQSRecord(letterEventGood),
          makeSQSRecord(letterEventBad),
        ],
      };

      const result = (await handler(
        event,
        {} as any,
        () => {},
      )) as SQSBatchResponse;

      expect(result.batchItemFailures).toHaveLength(1);
      expect(deps.sqsClient.send).toHaveBeenCalledTimes(1);
    });

    it("logs extraction and resolution for successful records", async () => {
      const deps = makeDeps();
      const letterEvent = makeLetterEventV2();

      setupDefaultMocks();

      const handler = createSupplierAllocatorHandler(deps);
      const event: SQSEvent = {
        Records: [makeSQSRecord(letterEvent)],
      };

      await handler(event, {} as any, () => {});

      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Extracted letter event",
        }),
      );
      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Resolved supplier spec",
        }),
      );
      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Sending message to upsert letter queue",
        }),
      );
    });
  });
});
