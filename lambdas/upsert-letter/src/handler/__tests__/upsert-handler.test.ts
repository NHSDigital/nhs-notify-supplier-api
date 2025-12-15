import { SNSMessage, SQSEvent } from "aws-lambda";
import pino from "pino";
import { LetterRepository } from "internal/datastore/src";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import createUpsertLetterHandler from "../upsert-handler";
import { Deps } from "../../config/deps";
import { EnvVars } from "../../config/env";

function createSqsRecord(msgId: string, body: string) {
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
function createNotification(
  event: LetterRequestPreparedEventV2 | LetterRequestPreparedEvent,
): Partial<SNSMessage> {
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

function createValidV2Event(
  overrides: Partial<any> = {},
): LetterRequestPreparedEventV2 {
  // minimal valid event matching the prepared letter schema
  const now = new Date().toISOString();

  return {
    specversion: "1.0",
    id: overrides.id ?? "7b9a03ca-342a-4150-b56b-989109c45613",
    source: "/data-plane/letter-rendering/test",
    subject: "client/client1/letter-request/letterRequest1",
    type: "uk.nhs.notify.letter-rendering.letter-request.prepared.v2",
    time: now,
    dataschema:
      "https://notify.nhs.uk/cloudevents/schemas/letter-rendering/letter-request.prepared.2.0.0.schema.json",
    dataschemaversion: "2.0.0",
    data: {
      domainId: overrides.domainId ?? "letter1",
      letterVariantId: overrides.letterVariantId ?? "lv1",
      requestId: overrides.requestId ?? "request1",
      requestItemId: overrides.requestItemId ?? "requestItem1",
      requestItemPlanId: overrides.requestItemPlanId ?? "requestItemPlan1",
      clientId: overrides.clientId ?? "client1",
      campaignId: overrides.campaignId ?? "campaign1",
      templateId: overrides.templateId ?? "template1",
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

function createValidV1Event(
  overrides: Partial<any> = {},
): LetterRequestPreparedEvent {
  // minimal valid event matching the prepared letter schema
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
      letterVariantId: overrides.letterVariantId ?? "lv1",
      requestId: overrides.requestId ?? "request1",
      requestItemId: overrides.requestItemId ?? "requestItem1",
      requestItemPlanId: overrides.requestItemPlanId ?? "requestItemPlan1",
      clientId: overrides.clientId ?? "client1",
      campaignId: overrides.campaignId ?? "campaign1",
      templateId: overrides.templateId ?? "template1",
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

describe("createUpsertLetterHandler", () => {
  const mockedDeps: jest.Mocked<Deps> = {
    letterRepo: {
      upsertLetter: jest.fn(),
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
    const evt: SQSEvent = {
      Records: [
        createSqsRecord(
          "msg1",
          JSON.stringify(createNotification(createValidV2Event())),
        ),
        createSqsRecord(
          "msg2",
          JSON.stringify(
            createNotification(
              createValidV2Event({
                id: "7b9a03ca-342a-4150-b56b-989109c45614",
                domainId: "letter2",
                url: "s3://letterDataBucket/letter2.pdf",
              }),
            ),
          ),
        ),
      ],
    };

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(0);

    expect(mockedDeps.letterRepo.upsertLetter).toHaveBeenCalledTimes(2);

    const firstArg = (mockedDeps.letterRepo.upsertLetter as jest.Mock).mock
      .calls[0][0];
    expect(firstArg.id).toBe("letter1");
    expect(firstArg.supplierId).toBe("supplier1");
    expect(firstArg.specificationId).toBe("spec1");
    expect(firstArg.url).toBe("s3://letterDataBucket/letter1.pdf");
    expect(firstArg.status).toBe("PENDING");
    expect(firstArg.groupId).toBe("client1campaign1template1");
    expect(firstArg.source).toBe("/data-plane/letter-rendering/test");

    const secondArg = (mockedDeps.letterRepo.upsertLetter as jest.Mock).mock
      .calls[1][0];
    expect(secondArg.id).toBe("letter2");
    expect(secondArg.supplierId).toBe("supplier1");
    expect(secondArg.specificationId).toBe("spec1");
    expect(secondArg.url).toBe("s3://letterDataBucket/letter2.pdf");
    expect(secondArg.status).toBe("PENDING");
    expect(secondArg.groupId).toBe("client1campaign1template1");
    expect(secondArg.groupId).toBe("client1campaign1template1");
    expect(firstArg.source).toBe("/data-plane/letter-rendering/test");
  });

  test("processes all v1 records successfully and returns no batch failures", async () => {
    const evt: SQSEvent = {
      Records: [
        createSqsRecord(
          "msg1",
          JSON.stringify(createNotification(createValidV1Event())),
        ),
        createSqsRecord(
          "msg2",
          JSON.stringify(
            createNotification(
              createValidV1Event({
                id: "7b9a03ca-342a-4150-b56b-989109c45614",
                domainId: "letter2",
                url: "s3://letterDataBucket/letter2.pdf",
              }),
            ),
          ),
        ),
      ],
    };

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(0);

    expect(mockedDeps.letterRepo.upsertLetter).toHaveBeenCalledTimes(2);

    const firstArg = (mockedDeps.letterRepo.upsertLetter as jest.Mock).mock
      .calls[0][0];
    expect(firstArg.id).toBe("letter1");
    expect(firstArg.supplierId).toBe("supplier1");
    expect(firstArg.specificationId).toBe("spec1");
    expect(firstArg.url).toBe("s3://letterDataBucket/letter1.pdf");
    expect(firstArg.status).toBe("PENDING");
    expect(firstArg.groupId).toBe("client1campaign1template1");
    expect(firstArg.source).toBe("/data-plane/letter-rendering/test");

    const secondArg = (mockedDeps.letterRepo.upsertLetter as jest.Mock).mock
      .calls[1][0];
    expect(secondArg.id).toBe("letter2");
    expect(secondArg.supplierId).toBe("supplier1");
    expect(secondArg.specificationId).toBe("spec1");
    expect(secondArg.url).toBe("s3://letterDataBucket/letter2.pdf");
    expect(secondArg.status).toBe("PENDING");
    expect(secondArg.groupId).toBe("client1campaign1template1");
    expect(secondArg.groupId).toBe("client1campaign1template1");
    expect(firstArg.source).toBe("/data-plane/letter-rendering/test");
  });

  test("invalid JSON body produces batch failure and logs error", async () => {
    const evt: SQSEvent = {
      Records: [createSqsRecord("bad-json", "this-is-not-json")],
    };

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-json");

    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][1]).toBe(
      "Error processing upsert",
    );
    expect(mockedDeps.letterRepo.upsertLetter).not.toHaveBeenCalled();
  });

  test("invalid notification schema produces batch failure and logs error", async () => {
    const evt: SQSEvent = {
      Records: [
        createSqsRecord(
          "bad-schema",
          JSON.stringify({ not: "the expected shape" }),
        ),
      ],
    };

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-schema");

    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][1]).toBe(
      "Error processing upsert",
    );
    expect(mockedDeps.letterRepo.upsertLetter).not.toHaveBeenCalled();
  });

  test("invalid event schema produces batch failure and logs error", async () => {
    const evt: SQSEvent = {
      Records: [
        createSqsRecord(
          "bad-schema",
          JSON.stringify({
            Type: "Notification",
            Message: JSON.stringify({ bad: "shape" }),
          }),
        ),
      ],
    };

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(result).toBeDefined();
    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("bad-schema");

    expect((mockedDeps.logger.info as jest.Mock).mock.calls[0][1]).toBe(
      "Trying to parse message with V1 schema",
    );
    expect((mockedDeps.logger.error as jest.Mock).mock.calls[0][1]).toBe(
      "Error parsing letter event in upsert",
    );
    expect(mockedDeps.letterRepo.upsertLetter).not.toHaveBeenCalled();
  });

  test("repository throwing for one record causes that message to be returned in batch failures while others succeed", async () => {
    (mockedDeps.letterRepo.upsertLetter as jest.Mock)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("ddb error"));

    const evt: SQSEvent = {
      Records: [
        createSqsRecord(
          "ok-msg",
          JSON.stringify(
            createNotification(
              createValidV2Event({
                id: "7b9a03ca-342a-4150-b56b-989109c45615",
                data: { domainId: "ok" },
              }),
            ),
          ),
        ),
        createSqsRecord(
          "fail-msg",
          JSON.stringify(
            createNotification(
              createValidV2Event({
                id: "7b9a03ca-342a-4150-b56b-989109c45616",
                data: { domainId: "ok" },
              }),
            ),
          ),
        ),
      ],
    };

    const result = await createUpsertLetterHandler(mockedDeps)(
      evt,
      {} as any,
      {} as any,
    );

    expect(mockedDeps.letterRepo.upsertLetter).toHaveBeenCalledTimes(2);

    if (!result) throw new Error("expected BatchResponse, got void");
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe("fail-msg");

    expect(mockedDeps.logger.error).toHaveBeenCalled();
  });
});
