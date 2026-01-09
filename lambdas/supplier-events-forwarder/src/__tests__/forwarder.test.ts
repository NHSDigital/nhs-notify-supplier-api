import { Context, SNSEvent, SNSEventRecord } from "aws-lambda";
import { FirehoseClient, PutRecordCommand } from "@aws-sdk/client-firehose";
import { mockDeep } from "jest-mock-extended";
import pino from "pino";
import createForwarder from "../forwarder";
import { Deps } from "../deps";

function createSNSEvent(records: SNSEventRecord[]): SNSEvent {
  return {
    Records: records,
  };
}

function createSNSEventRecord(
  message: string,
  overrides: Partial<SNSEventRecord["Sns"]> = {},
): SNSEventRecord {
  return {
    EventVersion: "1.0",
    EventSubscriptionArn:
      "arn:aws:sns:eu-west-2:123456789012:topic:subscription",
    EventSource: "aws:sns",
    Sns: {
      SignatureVersion: "1",
      Timestamp: "2026-01-09T12:00:00.000Z",
      Signature: "test-signature",
      SigningCertUrl: "https://sns.eu-west-2.amazonaws.com/cert.pem",
      MessageId: "test-message-id",
      Message: message,
      MessageAttributes: {},
      Type: "Notification",
      UnsubscribeUrl: "https://sns.eu-west-2.amazonaws.com/unsubscribe",
      TopicArn: "arn:aws:sns:eu-west-2:123456789012:test-topic",
      Subject: "Test Subject",
      ...overrides,
    },
  };
}

function buildExpectedSnsWrapper(record: SNSEventRecord): object {
  return {
    Type: "Notification",
    MessageId: record.Sns.MessageId,
    TopicArn: record.Sns.TopicArn,
    Subject: record.Sns.Subject,
    Message: record.Sns.Message,
    Timestamp: record.Sns.Timestamp,
    SignatureVersion: record.Sns.SignatureVersion,
    Signature: record.Sns.Signature,
    SigningCertUrl: record.Sns.SigningCertUrl,
    UnsubscribeUrl: record.Sns.UnsubscribeUrl,
    MessageAttributes: record.Sns.MessageAttributes,
  };
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
    it("should process a single SNS record and send to Firehose", async () => {
      const message = JSON.stringify({ eventType: "test", data: "value" });
      const snsRecord = createSNSEventRecord(message);
      const snsEvent = createSNSEvent([snsRecord]);

      const handler = createForwarder(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      expect(mockFirehoseClient.send).toHaveBeenCalledTimes(1);
      expect(mockFirehoseClient.send).toHaveBeenCalledWith(
        expect.any(PutRecordCommand),
      );

      const sentCommand = mockFirehoseClient.send.mock
        .calls[0][0] as PutRecordCommand;
      const expectedWrapper = buildExpectedSnsWrapper(snsRecord);
      expect(sentCommand.input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(`${JSON.stringify(expectedWrapper)}\n`),
        },
      });
    });

    it("should process multiple SNS records and send to Firehose", async () => {
      const message1 = JSON.stringify({ eventType: "test1" });
      const message2 = JSON.stringify({ eventType: "test2" });
      const message3 = JSON.stringify({ eventType: "test3" });

      const snsRecord1 = createSNSEventRecord(message1, {
        MessageId: "msg-1",
      });
      const snsRecord2 = createSNSEventRecord(message2, {
        MessageId: "msg-2",
      });
      const snsRecord3 = createSNSEventRecord(message3, {
        MessageId: "msg-3",
      });

      const snsEvent = createSNSEvent([snsRecord1, snsRecord2, snsRecord3]);

      const handler = createForwarder(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      expect(mockFirehoseClient.send).toHaveBeenCalledTimes(3);

      const sentCommands = mockFirehoseClient.send.mock.calls.map(
        (call: [PutRecordCommand]) => call[0],
      );

      expect(sentCommands[0].input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(
            `${JSON.stringify(buildExpectedSnsWrapper(snsRecord1))}\n`,
          ),
        },
      });

      expect(sentCommands[1].input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(
            `${JSON.stringify(buildExpectedSnsWrapper(snsRecord2))}\n`,
          ),
        },
      });

      expect(sentCommands[2].input).toEqual({
        DeliveryStreamName: mockDeliveryStreamName,
        Record: {
          Data: Buffer.from(
            `${JSON.stringify(buildExpectedSnsWrapper(snsRecord3))}\n`,
          ),
        },
      });
    });

    it("should handle empty SNS event with no records", async () => {
      const snsEvent = createSNSEvent([]);

      const handler = createForwarder(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      expect(mockFirehoseClient.send).not.toHaveBeenCalled();
    });

    it("should wrap message in SNS notification format", async () => {
      const message = JSON.stringify({ key: "value" });
      const snsRecord = createSNSEventRecord(message, {
        MessageId: "unique-msg-id",
        TopicArn: "arn:aws:sns:eu-west-2:123456789012:my-topic",
        Subject: "My Subject",
      });
      const snsEvent = createSNSEvent([snsRecord]);

      const handler = createForwarder(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      const sentCommand = mockFirehoseClient.send.mock
        .calls[0][0] as PutRecordCommand;
      const recordData = sentCommand.input.Record?.Data as Buffer;
      const parsedData = JSON.parse(recordData.toString().replace(/\n$/, ""));

      expect(parsedData).toEqual({
        Type: "Notification",
        MessageId: "unique-msg-id",
        TopicArn: "arn:aws:sns:eu-west-2:123456789012:my-topic",
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

    it("should append newline to wrapped message for JSON Lines format", async () => {
      const message = JSON.stringify({ key: "value" });
      const snsRecord = createSNSEventRecord(message);
      const snsEvent = createSNSEvent([snsRecord]);

      const handler = createForwarder(mockDeps);
      await handler(snsEvent, mockDeep<Context>(), jest.fn());

      const sentCommand = mockFirehoseClient.send.mock
        .calls[0][0] as PutRecordCommand;
      const recordData = sentCommand.input.Record?.Data as Buffer;

      expect(recordData.toString().endsWith("\n")).toBe(true);
    });
  });
});
