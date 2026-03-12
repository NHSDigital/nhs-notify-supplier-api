import { SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  $LetterEvent,
  LetterEvent,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";
import { MetricStatus } from "@internal/helpers";
import { SupplierConfigRepository } from "@internal/datastore";
import createSupplierAllocatorHandler from "../allocate-handler";
import * as supplierConfig from "../../services/supplier-config";
import { Deps } from "../../config/deps";
import { EnvVars } from "../../config/env";

jest.mock("@aws-sdk/client-sqs");
jest.mock("../../services/supplier-config");

function assertMetricLogged(
  logger: pino.Logger,
  supplier: string,
  priority: string,
  status: MetricStatus,
  count: number,
) {
  expect(logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      Supplier: supplier,
      Priority: priority,
      _aws: expect.objectContaining({
        CloudWatchMetrics: expect.arrayContaining([
          expect.objectContaining({
            Metrics: [
              expect.objectContaining({
                Name: status,
                Value: count,
              }),
            ],
          }),
        ]),
      }),
      [status]: count,
    }),
  );
}

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
      domainId: overrides.domainId ?? "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      groupId: "client_template",
      origin: {
        domain: "letter-rendering",
        event: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        source: "/data-plane/letter-rendering/prod/render-pdf",
        subject:
          "client/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
      },
      reasonCode: "R07",
      reasonText: "No such address",
      specificationId: "1y3q9v1zzzz",
      billingRef: "1y3q9v1zzzz",
      status: "RETURNED",
      supplierId: "supplier1",
      specificationBillingId: "billing1",
    },
    datacontenttype: "application/json",
    dataschema:
      "https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.RETURNED.1.0.0.schema.json",
    dataschemaversion: "1.0.0",
    id: overrides.id ?? "23f1f09c-a555-4d9b-8405-0b33490bc920",
    plane: "data",
    recordedtime: now,
    severitynumber: 2,
    severitytext: "INFO",
    source: "/data-plane/supplier-api/prod/update-status",
    specversion: "1.0",
    subject:
      "letter-origin/letter-rendering/letter/f47ac10b-58cc-4372-a567-0e02b2c3d479",
    time: now,
    traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    type: "uk.nhs.notify.supplier-api.letter.RETURNED.v1",
  });
}

describe.skip("createSupplierAllocatorHandler", () => {
  let mockSqsClient: jest.Mocked<SQSClient>;
  let mockedDeps: jest.Mocked<Deps>;

  beforeEach(() => {
    mockSqsClient = {
      send: jest.fn(),
    } as unknown as jest.Mocked<SQSClient>;

    mockedDeps = {
      supplierConfigRepo: {
        getLetterVariant: jest.fn().mockResolvedValue({
          id: "variant1",
          supplierId: "supplier1",
          specId: "spec1",
        }),
      } as unknown as SupplierConfigRepository,
      logger: { error: jest.fn(), info: jest.fn() } as unknown as pino.Logger,
      env: {
        SUPPLIER_CONFIG_TABLE_NAME: "SupplierConfigTable",
        VARIANT_MAP: {
          lv1: {
            supplierId: "supplier1",
            specId: "spec1",
            priority: 10,
            billingId: "billing1",
          },
        },
      } as EnvVars,
      sqsClient: mockSqsClient,
    } as jest.Mocked<Deps>;

    jest.clearAllMocks();
    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.queue";
  });

  afterEach(() => {
    delete process.env.UPSERT_LETTERS_QUEUE_URL;
  });

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(0);

    expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
    const sendCall = (mockSqsClient.send as jest.Mock).mock.calls[0][0];
    expect(sendCall).toBeInstanceOf(SendMessageCommand);

    const messageBody = JSON.parse(sendCall.input.MessageBody);
    expect(messageBody.letterEvent).toEqual(preparedEvent);
    expect(messageBody.supplierSpec).toEqual({
      supplierId: "supplier1",
      specId: "spec1",
      priority: 10,
      billingId: "billing1",
    });

    assertMetricLogged(
      mockedDeps.logger,
      "supplier1",
      "10",
      MetricStatus.Success,
      1,
    );
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

    expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
    const sendCall = (mockSqsClient.send as jest.Mock).mock.calls[0][0];
    const messageBody = JSON.parse(sendCall.input.MessageBody);
    expect(messageBody.supplierSpec).toEqual({
      supplierId: "supplier1",
      specId: "spec1",
      priority: 10,
      billingId: "billing1",
    });
  });

  test("returns batch failure for Update event", async () => {
    const preparedEvent = createSupplierStatusChangeEvent();

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("invalid-event", JSON.stringify(preparedEvent)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("invalid-event");
    expect((mockedDeps.logger.error as jest.Mock).mock.calls).toHaveLength(1);

    assertMetricLogged(
      mockedDeps.logger,
      "unknown",
      "unknown",
      MetricStatus.Failure,
      1,
    );
  });

  test("unwraps EventBridge envelope and extracts event details", async () => {
    const preparedEvent = createPreparedV2Event({ domainId: "letter-test" });

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(preparedEvent)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    await handler(evt, {} as any, {} as any);

    const sendCall = (mockSqsClient.send as jest.Mock).mock.calls[0][0];
    const messageBody = JSON.parse(sendCall.input.MessageBody);
    expect(messageBody.letterEvent.data.domainId).toBe("letter-test");
  });

  test("resolves correct supplier spec from variant map", async () => {
    const preparedEvent = createPreparedV2Event();

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(preparedEvent)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    await handler(evt, {} as any, {} as any);

    const sendCall = (mockSqsClient.send as jest.Mock).mock.calls[0][0];
    const messageBody = JSON.parse(sendCall.input.MessageBody);
    expect(messageBody.supplierSpec.supplierId).toBe("supplier1");
    expect(messageBody.supplierSpec.specId).toBe("spec1");
    expect(messageBody.supplierSpec.priority).toBe(10);
    expect(messageBody.supplierSpec.billingId).toBe("billing1");
  });

  test("processes multiple messages in batch", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "msg1",
        JSON.stringify(createPreparedV2Event({ domainId: "letter1" })),
      ),
      createSqsRecord(
        "msg2",
        JSON.stringify(createPreparedV2Event({ domainId: "letter2" })),
      ),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(0);
    expect(mockSqsClient.send).toHaveBeenCalledTimes(2);
  });

  test("returns batch failure for invalid JSON", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("bad-json", "this-is-not-json"),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");

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

      expect(result.batchItemFailures).toHaveLength(0);
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
    expect(result.batchItemFailures[0].itemIdentifier).toBe("msg1");
    expect((mockedDeps.logger.error as jest.Mock).mock.calls).toHaveLength(1);

    assertMetricLogged(
      mockedDeps.logger,
      "supplier1",
      "10",
      MetricStatus.Failure,
      1,
    );
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
    expect(result.batchItemFailures[0].itemIdentifier).toBe("fail-msg");

    expect(mockSqsClient.send).toHaveBeenCalledTimes(2);

    assertMetricLogged(
      mockedDeps.logger,
      "supplier1",
      "10",
      MetricStatus.Success,
      2,
    );
    assertMetricLogged(
      mockedDeps.logger,
      "unknown",
      "unknown",
      MetricStatus.Failure,
      1,
    );
  });

  test("sends correct queue URL in SQS message command", async () => {
    const preparedEvent = createPreparedV2Event();

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(preparedEvent)),
    ]);

    const queueUrl = "https://sqs.eu-west-2.amazonaws.com/123456789/test-queue";
    process.env.UPSERT_LETTERS_QUEUE_URL = queueUrl;

    const handler = createSupplierAllocatorHandler(mockedDeps);
    await handler(evt, {} as any, {} as any);

    const sendCall = (mockSqsClient.send as jest.Mock).mock.calls[0][0];
    expect(sendCall.input.QueueUrl).toBe(queueUrl);
  });

  test("emits separate metrics per supplier and priority combination", async () => {
    mockedDeps.env.VARIANT_MAP = {
      lv1: { supplierId: "supplier1", specId: "spec1", priority: 10 },
      lv2: { supplierId: "supplier2", specId: "spec2", priority: 5 },
    } as any;

    const eventForSupplier1 = createPreparedV2Event({ domainId: "letter1" });
    const eventForSupplier2 = {
      ...createPreparedV2Event({ domainId: "letter2" }),
      data: {
        ...createPreparedV2Event({ domainId: "letter2" }).data,
        letterVariantId: "lv2",
      },
    };

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(eventForSupplier1)),
      createSqsRecord("msg2", JSON.stringify(eventForSupplier2)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(0);

    assertMetricLogged(
      mockedDeps.logger,
      "supplier1",
      "10",
      MetricStatus.Success,
      1,
    );
    assertMetricLogged(
      mockedDeps.logger,
      "supplier2",
      "5",
      MetricStatus.Success,
      1,
    );
  });
});
