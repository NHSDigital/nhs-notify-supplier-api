import { Context, SNSEvent, SNSEventRecord } from "aws-lambda";
import { SQSClient } from "@aws-sdk/client-sqs";
import { mockDeep } from "jest-mock-extended";
import pino from "pino";
import {
  $LetterEvent,
  LetterEvent,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import createAllocator from "../allocator";
import { Deps } from "../deps";

function createSNSEvent(records: SNSEventRecord[]): SNSEvent {
  return {
    Records: records,
  };
}

function createSNSEventRecord(message: string): SNSEventRecord {
  return {
    Sns: {
      Message: message,
    } as SNSEventRecord["Sns"],
  } as SNSEventRecord;
}

function createLetterEvent(domainId: string): LetterEvent {
  const now = new Date().toISOString();

  return $LetterEvent.parse({
    data: {
      domainId,
      groupId: "client_template",
      origin: {
        domain: "letter-rendering",
        event: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        source: "/data-plane/letter-rendering/prod/render-pdf",
        subject:
          "client/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-request/test",
      },

      specificationId: "spec-001",
      billingRef: "billing-001",
      status: "PENDING",
      supplierId: "supplier-001",
    },
    datacontenttype: "application/json",
    dataschema:
      "https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.PENDING.1.0.0.schema.json",
    dataschemaversion: "1.0.0",
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
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
    type: "uk.nhs.notify.supplier-api.letter.PENDING.v1",
  });
}

describe("allocator", () => {
  const mockQueueUrl =
    "https://sqs.eu-west-2.amazonaws.com/123456789012/test-queue.fifo";

  let mockDeps: Deps;

  beforeEach(() => {
    mockDeps = {
      sqsClient: { send: jest.fn() } as unknown as SQSClient,
      queueUrl: mockQueueUrl,
      logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    };

    jest.clearAllMocks();
  });

  describe("createAllocator", () => {
    it("should place the SNS event unchanged on the SQS queue", async () => {
      const letterEvent = createLetterEvent("id1");
      const snsEvent = createSNSEvent([
        createSNSEventRecord(JSON.stringify(letterEvent)),
      ]);

      const handler = createAllocator(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      expect(mockDeps.sqsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            QueueUrl: mockQueueUrl,
            MessageBody: JSON.stringify(snsEvent.Records[0].Sns),
            MessageGroupId: expect.any(String),
          },
        }),
      );
    });

    it("should process multiple SNS records and send messages to SQS", async () => {
      const letterEvent1 = createLetterEvent("id1");
      const letterEvent2 = createLetterEvent("id2");
      const letterEvent3 = createLetterEvent("id3");

      const snsEvent = createSNSEvent([
        createSNSEventRecord(JSON.stringify(letterEvent1)),
        createSNSEventRecord(JSON.stringify(letterEvent2)),
        createSNSEventRecord(JSON.stringify(letterEvent3)),
      ]);

      const handler = createAllocator(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      expect(mockDeps.sqsClient.send).toHaveBeenCalledTimes(3);

      expect(mockDeps.sqsClient.send).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          input: {
            QueueUrl: mockQueueUrl,
            MessageBody: JSON.stringify(snsEvent.Records[0].Sns),
            MessageGroupId: expect.any(String),
          },
        }),
      );
      expect(mockDeps.sqsClient.send).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          input: {
            QueueUrl: mockQueueUrl,
            MessageBody: JSON.stringify(snsEvent.Records[1].Sns),
            MessageGroupId: expect.any(String),
          },
        }),
      );
      expect(mockDeps.sqsClient.send).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          input: {
            QueueUrl: mockQueueUrl,
            MessageBody: JSON.stringify(snsEvent.Records[2].Sns),
            MessageGroupId: expect.any(String),
          },
        }),
      );
    });

    it("should handle empty SNS event with no records", async () => {
      const snsEvent = createSNSEvent([]);

      const handler = createAllocator(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      expect(mockDeps.sqsClient.send).not.toHaveBeenCalled();
    });
  });
});
