import { SQSEvent, SQSRecord } from "aws-lambda";
import pino from "pino";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  $LetterEvent,
  LetterEvent,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";
import createSupplierAllocatorHandler from "../allocate-handler";
import { Deps } from "../../config/deps";
import { EnvVars } from "../../config/env";

function createSQSEvent(records: SQSRecord[]): SQSEvent {
  return {
    Records: records,
  };
}

function createSqsRecord(msgId: string, body: string): SQSRecord {
  return {
    messageId: msgId,
    receiptHandle: "",
    body,
    attributes: {
      ApproximateReceiveCount: "",
      SentTimestamp: "",
      SenderId: "",
      ApproximateFirstReceiveTimestamp: "",
    },
    messageAttributes: {},
    md5OfBody: "",
    eventSource: "",
    eventSourceARN: "",
    awsRegion: "",
  };
}

function createPreparedV1Event(
  overrides: Partial<any> = {},
): LetterRequestPreparedEvent {
  const now = new Date().toISOString();

  return {
    specversion: "1.0",
    id: overrides.id ?? "7b9a03ca-342a-4150-b56b-989109c45613",
    source: "/data-plane/letter-rendering/test",
    subject: "client/client1/letter-request/letterRequest1",
    type: "uk.nhs.notify.letter-rendering.letter-request.prepared.v1",
    time: now,
    dataschema:
      "https://notify.nhs.uk/cloudevents/schemas/letter-rendering/letter-request.prepared.1.0.0.schema.json",
    dataschemaversion: "1.0.0",
    data: {
      domainId: overrides.domainId ?? "letter1",
      letterVariantId: "lv1",
      requestId: "request1",
      requestItemId: "requestItem1",
      requestItemPlanId: "requestItemPlan1",
      clientId: "client1",
      campaignId: "campaign1",
      templateId: "template1",
      url: overrides.url ?? "s3://letterDataBucket/letter1.pdf",
      sha256Hash:
        "3a7bd3e2360a3d29eea436fcfb7e44c735d117c8f2f1d2d1e4f6e8f7e6e8f7e6",
      createdAt: now,
      pageCount: 1,
      status: "PREPARED",
    },
    traceparent: "00-0af7651916cd43dd8448eb211c803191-b7ad6b7169203331-01",
    recordedtime: now,
    severitynumber: 2,
    severitytext: "INFO",
    plane: "data",
  };
}

function createPreparedV2Event(
  overrides: Partial<any> = {},
): LetterRequestPreparedEventV2 {
  return {
    ...createPreparedV1Event(overrides),
    type: "uk.nhs.notify.letter-rendering.letter-request.prepared.v2",
    dataschema:
      "https://notify.nhs.uk/cloudevents/schemas/letter-rendering/letter-request.prepared.2.0.1.schema.json",
    dataschemaversion: "2.0.1",
  };
}

function createSupplierStatusChangeEvent(
  overrides: Partial<any> = {},
): LetterEvent {
  const now = new Date().toISOString();

  return $LetterEvent.parse({
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

describe("createSupplierAllocatorHandler", () => {
  let mockSqsClient: jest.Mocked<SQSClient>;
  let mockedDeps: jest.Mocked<Deps>;

  beforeEach(() => {
    mockSqsClient = {
      send: jest.fn(),
    } as unknown as jest.Mocked<SQSClient>;

    mockedDeps = {
      logger: { error: jest.fn(), info: jest.fn() } as unknown as pino.Logger,
      env: {
        VARIANT_MAP: {
          lv1: {
            supplierId: "supplier1",
            specId: "spec1",
          },
        },
      } as EnvVars,
      sqsClient: mockSqsClient,
    } as jest.Mocked<Deps>;

    jest.clearAllMocks();
  });

  test("parses SNS notification and sends message to SQS queue for v2 event", async () => {
    const preparedEvent = createPreparedV2Event();
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(preparedEvent)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

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
    });
  });

  test("parses SNS notification and sends message to SQS queue for v1 event", async () => {
    const preparedEvent = createPreparedV1Event();

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(preparedEvent)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(0);

    expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
    const sendCall = (mockSqsClient.send as jest.Mock).mock.calls[0][0];
    const messageBody = JSON.parse(sendCall.input.MessageBody);
    expect(messageBody.supplierSpec).toEqual({
      supplierId: "supplier1",
      specId: "spec1",
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
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-json");
    expect((mockedDeps.logger.error as jest.Mock).mock.calls).toHaveLength(1);
  });

  test("returns batch failure when event type is missing", async () => {
    const event = { no: "type" };

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("no-type", JSON.stringify(event)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("no-type");
  });

  test("returns batch failure when UPSERT_LETTERS_QUEUE_URL is not set", async () => {
    const preparedEvent = createPreparedV2Event();

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(preparedEvent)),
    ]);

    delete process.env.UPSERT_LETTERS_QUEUE_URL;

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("msg1");
    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][0].err).toEqual(
      expect.objectContaining({
        message: "UPSERT_LETTERS_QUEUE_URL not configured",
      }),
    );
  });

  test("handles SQS send errors and returns batch failure", async () => {
    const preparedEvent = createPreparedV2Event();

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("msg1", JSON.stringify(preparedEvent)),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const sqsError = new Error("SQS send failed");
    (mockSqsClient.send as jest.Mock).mockRejectedValueOnce(sqsError);

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("msg1");
    expect((mockedDeps.logger.error as jest.Mock).mock.calls).toHaveLength(1);
  });

  test("processes mixed batch with successes and failures", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "ok-msg",
        JSON.stringify(createPreparedV2Event({ domainId: "letter1" })),
      ),
      createSqsRecord("fail-msg", "invalid-json"),
      createSqsRecord(
        "ok-msg-2",
        JSON.stringify(createPreparedV2Event({ domainId: "letter2" })),
      ),
    ]);

    process.env.UPSERT_LETTERS_QUEUE_URL = "https://sqs.test.queue";

    const handler = createSupplierAllocatorHandler(mockedDeps);
    const result = await handler(evt, {} as any, {} as any);
    if (!result) throw new Error("expected BatchResponse, got void");

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("fail-msg");

    expect(mockSqsClient.send).toHaveBeenCalledTimes(2);
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
});
