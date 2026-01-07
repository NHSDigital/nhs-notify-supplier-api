import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { FirehoseClient, PutRecordCommand } from "@aws-sdk/client-firehose";
import { mockDeep } from "jest-mock-extended";
import pino from "pino";
import createForwarder from "../forwarder";
import { Deps } from "../deps";

function createSQSEvent(records: SQSRecord[]): SQSEvent {
  return {
    Records: records,
  };
}

/**
 * Creates an SQS record with a body containing the SNS notification wrapper.
 * This simulates what SNS delivers to SQS when raw_message_delivery is false.
 */
function createSQSRecord(
  body: string,
  messageId = "test-sqs-msg-id",
): SQSRecord {
  return {
    messageId,
    receiptHandle: "test-receipt-handle",
    body,
    attributes: {
      ApproximateReceiveCount: "1",
      SentTimestamp: "1704801600000",
      SenderId: "123456789012",
      ApproximateFirstReceiveTimestamp: "1704801600000",
    },
    messageAttributes: {},
    md5OfBody: "test-md5",
    eventSource: "aws:sqs",
    eventSourceARN: "arn:aws:sqs:eu-west-2:123456789012:test-queue.fifo",
    awsRegion: "eu-west-2",
  };
}

/**
 * Creates an SNS notification wrapper as it would appear in the SQS message body
 * when raw_message_delivery is false.
 */
function createSnsNotificationWrapper(
  message: string,
  overrides: Partial<{
    MessageId: string;
    TopicArn: string;
    Subject: string;
  }> = {},
): string {
  return JSON.stringify({
    Type: "Notification",
    MessageId: overrides.MessageId ?? "test-sns-message-id",
    TopicArn:
      overrides.TopicArn ??
      "arn:aws:sns:eu-west-2:123456789012:test-topic.fifo",
    Subject: overrides.Subject ?? "Test Subject",
    Message: message,
    Timestamp: "2026-01-09T12:00:00.000Z",
    SignatureVersion: "1",
    Signature: "test-signature",
    SigningCertUrl: "https://sns.eu-west-2.amazonaws.com/cert.pem",
    UnsubscribeUrl: "https://sns.eu-west-2.amazonaws.com/unsubscribe",
    MessageAttributes: {},
  });
}

describe("forwarder", () => {
  const mockDeliveryStreamName = "test-delivery-stream";

  let mockFirehoseClient: jest.Mocked<FirehoseClient>;
  let mockDeps: Deps;

  beforeEach(() => {
    mockFirehoseClient = {
      send: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<FirehoseClient>;

    mockDeps = {
      firehoseClient: mockFirehoseClient,
      deliveryStreamName: mockDeliveryStreamName,
      logger: pino({ level: "silent" }),
    };

    jest.clearAllMocks();
  });

  describe("createForwarder", () => {
    it("should process a single SQS record and send to Firehose", async () => {
      const message = JSON.stringify({ eventType: "test", data: "value" });
      const snsWrapper = createSnsNotificationWrapper(message);
      const sqsRecord = createSQSRecord(snsWrapper);
      const sqsEvent = createSQSEvent([sqsRecord]);

      const handler = createForwarder(mockDeps);
      await handler(sqsEvent, mockDeep<Context>(), jest.fn());

      expect(mockFirehoseClient.send).toHaveBeenCalledTimes(1);
      expect(mockFirehoseClient.send).toHaveBeenCalledWith(
        expect.any(PutRecordCommand),
      );

      const sentCommand = mockFirehoseClient.send.mock
        .calls[0][0] as PutRecordCommand;
      expect(sentCommand.input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(`${snsWrapper}\n`),
        },
      });
    });

    it("should process multiple SQS records and send to Firehose", async () => {
      const message1 = JSON.stringify({ eventType: "test1" });
      const message2 = JSON.stringify({ eventType: "test2" });
      const message3 = JSON.stringify({ eventType: "test3" });

      const snsWrapper1 = createSnsNotificationWrapper(message1, {
        MessageId: "msg-1",
      });
      const snsWrapper2 = createSnsNotificationWrapper(message2, {
        MessageId: "msg-2",
      });
      const snsWrapper3 = createSnsNotificationWrapper(message3, {
        MessageId: "msg-3",
      });

      const sqsEvent = createSQSEvent([
        createSQSRecord(snsWrapper1, "sqs-1"),
        createSQSRecord(snsWrapper2, "sqs-2"),
        createSQSRecord(snsWrapper3, "sqs-3"),
      ]);

      const handler = createForwarder(mockDeps);
      await handler(sqsEvent, mockDeep<Context>(), jest.fn());

      expect(mockFirehoseClient.send).toHaveBeenCalledTimes(3);

      const sentCommands = mockFirehoseClient.send.mock.calls.map(
        (call) => call[0] as PutRecordCommand,
      );

      expect(sentCommands[0].input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(`${snsWrapper1}\n`),
        },
      });

      expect(sentCommands[1].input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(`${snsWrapper2}\n`),
        },
      });

      expect(sentCommands[2].input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(`${snsWrapper3}\n`),
        },
      });
    });

    it("should handle empty SQS event with no records", async () => {
      const sqsEvent = createSQSEvent([]);

      const handler = createForwarder(mockDeps);
      await handler(sqsEvent, mockDeep<Context>(), jest.fn());

      expect(mockFirehoseClient.send).not.toHaveBeenCalled();
    });

    it("should forward the SNS notification wrapper from SQS body to Firehose", async () => {
      const message = JSON.stringify({ key: "value" });
      const snsWrapper = createSnsNotificationWrapper(message, {
        MessageId: "unique-msg-id",
        TopicArn: "arn:aws:sns:eu-west-2:123456789012:my-topic.fifo",
        Subject: "My Subject",
      });
      const sqsRecord = createSQSRecord(snsWrapper);
      const sqsEvent = createSQSEvent([sqsRecord]);

      const handler = createForwarder(mockDeps);
      await handler(sqsEvent, mockDeep<Context>(), jest.fn());

      const sentCommand = mockFirehoseClient.send.mock
        .calls[0][0] as PutRecordCommand;
      const recordData = sentCommand.input.Record?.Data as Buffer;
      const parsedData = JSON.parse(recordData.toString().replace(/\n$/, ""));

      expect(parsedData).toEqual({
        Type: "Notification",
        MessageId: "unique-msg-id",
        TopicArn: "arn:aws:sns:eu-west-2:123456789012:my-topic.fifo",
        Subject: "My Subject",
        Message: message,
        Timestamp: "2026-01-09T12:00:00.000Z",
        SignatureVersion: "1",
        Signature: "test-signature",
        SigningCertUrl: "https://sns.eu-west-2.amazonaws.com/cert.pem",
        UnsubscribeUrl: "https://sns.eu-west-2.amazonaws.com/unsubscribe",
        MessageAttributes: {},
      });
    });

    it("should append newline to message for JSON Lines format", async () => {
      const message = JSON.stringify({ key: "value" });
      const snsWrapper = createSnsNotificationWrapper(message);
      const sqsRecord = createSQSRecord(snsWrapper);
      const sqsEvent = createSQSEvent([sqsRecord]);

      const handler = createForwarder(mockDeps);
      await handler(sqsEvent, mockDeep<Context>(), jest.fn());

      const sentCommand = mockFirehoseClient.send.mock
        .calls[0][0] as PutRecordCommand;
      const recordData = sentCommand.input.Record?.Data as Buffer;

      expect(recordData.toString().endsWith("\n")).toBe(true);
    });
  });
});
