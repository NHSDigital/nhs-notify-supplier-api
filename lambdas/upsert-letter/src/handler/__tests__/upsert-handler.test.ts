import { SNSMessage, SQSEvent, SQSRecord } from "aws-lambda";
import pino from "pino";
import { LetterRepository } from "internal/datastore/src";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  $LetterEvent,
  LetterEvent,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";
import createUpsertLetterHandler from "../upsert-handler";
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

type SupportedEvent =
  | LetterRequestPreparedEventV2
  | LetterRequestPreparedEvent
  | LetterEvent;

function createEventBridgeNotification(
  event: SupportedEvent,
): Partial<SNSMessage> {
  return {
    SignatureVersion: "",
    Timestamp: "",
    Signature: "",
    SigningCertUrl: "",
    MessageId: "",
    Message: createEventBridgeEvent(event),
    MessageAttributes: {},
    Type: "Notification",
    UnsubscribeUrl: "",
    TopicArn: "",
    Subject: "",
    Token: "",
  };
}

function createNotification(event: SupportedEvent): Partial<SNSMessage> {
  return {
    SignatureVersion: "",
    Timestamp: "",
    Signature: "",
    SigningCertUrl: "",
    MessageId: "",
    Message: JSON.stringify(event),
    MessageAttributes: {},
    Type: "Notification",
    UnsubscribeUrl: "",
    TopicArn: "",
    Subject: "",
    Token: "",
  };
}

function createEventBridgeEvent(event: SupportedEvent): string {
  const now = new Date().toISOString();
  const eventBridgeEnvelope = {
    version: "0",
    id: "4f28e649-6832-18e8-7261-4b63e6dcd3b5",
    "detail-type": event.type,
    source: "custom.event",
    account: "815490582396",
    time: now,
    region: "eu-west-2",
    resources: [],
    detail: event,
  };
  return JSON.stringify(eventBridgeEnvelope);
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

describe("createUpsertLetterHandler", () => {
  const mockedDeps: jest.Mocked<Deps> = {
    letterRepo: {
      putLetter: jest.fn(),
      updateLetterStatus: jest.fn(),
    } as unknown as LetterRepository,
    logger: { error: jest.fn(), info: jest.fn() } as unknown as pino.Logger,
    env: {
      LETTERS_TABLE_NAME: "LETTERS_TABLE_NAME",
      LETTER_TTL_HOURS: 12_960,
      VARIANT_MAP: {
        lv1: {
          supplierId: "supplier1",
          specId: "spec1",
        },
      },
    } as EnvVars,
  } as Deps;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("processes all records successfully and returns no batch failures", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "msg1",
        JSON.stringify(createEventBridgeNotification(createPreparedV2Event())),
      ),
      createSqsRecord(
        "msg2",
        JSON.stringify(createNotification(createSupplierStatusChangeEvent())),
      ),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(0);

    expect(mockedDeps.letterRepo.putLetter).toHaveBeenCalledTimes(1);
    expect(mockedDeps.letterRepo.updateLetterStatus).toHaveBeenCalledTimes(1);

    const firstArg = (mockedDeps.letterRepo.putLetter as jest.Mock).mock
      .calls[0][0];
    expect(firstArg.id).toBe("letter1");
    expect(firstArg.eventId).toBe("7b9a03ca-342a-4150-b56b-989109c45613");
    expect(firstArg.supplierId).toBe("supplier1");
    expect(firstArg.specificationId).toBe("spec1");
    expect(firstArg.url).toBe("s3://letterDataBucket/letter1.pdf");
    expect(firstArg.status).toBe("PENDING");
    expect(firstArg.groupId).toBe("client1campaign1template1");
    expect(firstArg.source).toBe("/data-plane/letter-rendering/test");

    const secondArg = (mockedDeps.letterRepo.updateLetterStatus as jest.Mock)
      .mock.calls[0][0];
    expect(secondArg.id).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
    expect(secondArg.supplierId).toBe("supplier1");
    expect(secondArg.status).toBe("RETURNED");
    expect(secondArg.reasonCode).toBe("R07");
    expect(secondArg.reasonText).toBe("No such address");
  });

  test("processes all v1 records successfully and returns no batch failures", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "msg1",
        JSON.stringify(createNotification(createPreparedV1Event())),
      ),
      createSqsRecord(
        "msg2",
        JSON.stringify(
          createNotification(
            createPreparedV1Event({
              id: "7b9a03ca-342a-4150-b56b-989109c45614",
              domainId: "letter2",
              url: "s3://letterDataBucket/letter2.pdf",
            }),
          ),
        ),
      ),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(0);

    expect(mockedDeps.letterRepo.putLetter).toHaveBeenCalledTimes(2);

    const firstArg = (mockedDeps.letterRepo.putLetter as jest.Mock).mock
      .calls[0][0];
    expect(firstArg.id).toBe("letter1");
    expect(firstArg.supplierId).toBe("supplier1");
    expect(firstArg.specificationId).toBe("spec1");
    expect(firstArg.url).toBe("s3://letterDataBucket/letter1.pdf");
    expect(firstArg.status).toBe("PENDING");
    expect(firstArg.groupId).toBe("client1campaign1template1");
    expect(firstArg.source).toBe("/data-plane/letter-rendering/test");

    const secondArg = (mockedDeps.letterRepo.putLetter as jest.Mock).mock
      .calls[1][0];
    expect(secondArg.id).toBe("letter2");
    expect(secondArg.supplierId).toBe("supplier1");
    expect(secondArg.specificationId).toBe("spec1");
    expect(secondArg.url).toBe("s3://letterDataBucket/letter2.pdf");
    expect(secondArg.status).toBe("PENDING");
    expect(secondArg.groupId).toBe("client1campaign1template1");
    expect(firstArg.source).toBe("/data-plane/letter-rendering/test");
  });

  test("invalid JSON body produces batch failure and logs error", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord("bad-json", "this-is-not-json"),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-json");

    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        description: "Error processing upsert of record",
        messageId: "bad-json",
      }),
    );
    expect(mockedDeps.letterRepo.putLetter).not.toHaveBeenCalled();
  });

  test("invalid notification schema produces batch failure and logs error", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "bad-notification-schema",
        JSON.stringify({ not: "unexpected notification shape" }),
      ),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe(
      "bad-notification-schema",
    );

    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        description: "Error processing upsert of record",
        messageId: "bad-notification-schema",
      }),
    );
    expect(mockedDeps.letterRepo.putLetter).not.toHaveBeenCalled();
  });

  test("no event type produces batch failure and logs error", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "bad-event-type",
        JSON.stringify({
          Type: "Notification",
          Message: JSON.stringify({ no: "type" }),
        }),
      ),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-event-type");
    expect(mockedDeps.letterRepo.putLetter).not.toHaveBeenCalled();
    expect(mockedDeps.letterRepo.updateLetterStatus).not.toHaveBeenCalled();
    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        description: "Error processing upsert of record",
        messageId: "bad-event-type",
      }),
    );
  });

  test("invalid event type produces batch failure and logs error", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "bad-event-type",
        JSON.stringify({
          Type: "Notification",
          Message: JSON.stringify({ type: "unexpected type" }),
        }),
      ),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-event-type");
    expect(mockedDeps.letterRepo.putLetter).not.toHaveBeenCalled();
    expect(mockedDeps.letterRepo.updateLetterStatus).not.toHaveBeenCalled();
    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        description: "Error processing upsert of record",
        messageId: "bad-event-type",
      }),
    );
  });

  test("valid event type and invalid schema produces batch failure and logs error", async () => {
    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "bad-event-schema",
        JSON.stringify({
          Type: "Notification",
          Message: JSON.stringify({
            type: "uk.nhs.notify.letter-rendering.letter-request.prepared",
            some: "unexpected shape",
          }),
        }),
      ),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-event-schema");
    expect(mockedDeps.letterRepo.putLetter).not.toHaveBeenCalled();
    expect(mockedDeps.letterRepo.updateLetterStatus).not.toHaveBeenCalled();
    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        description: "Error processing upsert of record",
        messageId: "bad-event-schema",
      }),
    );
  });

  test("repository throwing for one record causes that message to be returned in batch failures while others succeed", async () => {
    (mockedDeps.letterRepo.putLetter as jest.Mock)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("ddb error"));

    const evt: SQSEvent = createSQSEvent([
      createSqsRecord(
        "ok-msg",
        JSON.stringify(
          createNotification(
            createPreparedV2Event({
              id: "7b9a03ca-342a-4150-b56b-989109c45615",
              domainId: "ok",
            }),
          ),
        ),
      ),
      createSqsRecord(
        "fail-msg",
        JSON.stringify(
          createNotification(
            createPreparedV2Event({
              id: "7b9a03ca-342a-4150-b56b-989109c45616",
              domainId: "fail",
            }),
          ),
        ),
      ),
    ]);

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(mockedDeps.letterRepo.putLetter).toHaveBeenCalledTimes(2);

    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("fail-msg");

    expect(mockedDeps.logger.error).toHaveBeenCalled();
  });
});
