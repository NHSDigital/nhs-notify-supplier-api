import { SNSClient } from "@aws-sdk/client-sns";
import * as pino from "pino";
import {
  Context,
  KinesisStreamEvent,
  KinesisStreamRecordPayload,
} from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import { MI } from "@internal/datastore";
import { createHandler } from "../mi-updates-transformer";
import { Deps } from "../deps";
import { EnvVars } from "../env";
import { mapMIToCloudEvent } from "../mappers/mi-mapper";

// Make crypto return consistent values, since we're calling it in both prod and test code and comparing the values
const realCrypto = jest.requireActual("crypto");
const randomBytes: Record<string, any> = {
  "8": realCrypto.randomBytes(8),
  "16": realCrypto.randomBytes(16),
};
jest.mock("crypto", () => ({
  randomUUID: () => "4616b2d9-b7a5-45aa-8523-fa7419626b69",
  randomBytes: (size: number) => randomBytes[String(size)],
}));

function generateKinesisEvent(miEvents: object[]): KinesisStreamEvent {
  const records = miEvents
    .map((mi) => Buffer.from(JSON.stringify(mi), "utf8").toString("base64"))
    .map(
      (data) =>
        ({ kinesis: { data } }) as unknown as KinesisStreamRecordPayload,
    );
  return { Records: records } as unknown as KinesisStreamEvent;
}
function generateMIEvents(numMIEvents: number): MI[] {
  return [...Array.from({ length: numMIEvents }).keys()].map((i) => ({
    id: String(i + 1),
    lineItem: `lineItem${i + 1}`,
    timestamp: new Date().toISOString(),
    quantity: 100 + i,
    supplierId: `supplier${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 3600,
    specificationId: "spec1",
    groupId: "group1",
    stockRemaining: 500 - i,
  }));
}

describe("mi-updates-transformer Lambda", () => {
  const mockedDeps: jest.Mocked<Deps> = {
    snsClient: { send: jest.fn() } as unknown as SNSClient,
    logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      EVENTPUB_SNS_TOPIC_ARN: "arn:aws:sns:region:account:topic",
    } as unknown as EnvVars,
  } as Deps;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("processes Kinesis events and publishes them to SNS", async () => {
    const handler = createHandler(mockedDeps);
    const miEvents = generateMIEvents(1);
    const expectedEntries = [
      expect.objectContaining({
        Message: JSON.stringify(mapMIToCloudEvent(miEvents[0])),
      }),
    ];

    await handler(
      generateKinesisEvent(miEvents),
      mockDeep<Context>(),
      jest.fn(),
    );

    expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries,
        }),
      }),
    );
  });

  it("batches mutiple records into a single call to SNS", async () => {
    const handler = createHandler(mockedDeps);
    const miEvents = generateMIEvents(10);
    const expectedEntries = miEvents.map((miEvent) =>
      expect.objectContaining({
        Message: JSON.stringify(mapMIToCloudEvent(miEvent)),
      }),
    );

    await handler(
      generateKinesisEvent(miEvents),
      mockDeep<Context>(),
      jest.fn(),
    );

    expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries,
        }),
      }),
    );
  });

  it("splits more than 10 records into multiple SNS calls", async () => {
    const handler = createHandler(mockedDeps);
    const miEvents = generateMIEvents(21);
    const expectedEntries = [
      miEvents.slice(0, 10).map((miEvent) =>
        expect.objectContaining({
          Message: JSON.stringify(mapMIToCloudEvent(miEvent)),
        }),
      ),
      miEvents.slice(10, 20).map((miEvent) =>
        expect.objectContaining({
          Message: JSON.stringify(mapMIToCloudEvent(miEvent)),
        }),
      ),
      miEvents.slice(20).map((miEvent) =>
        expect.objectContaining({
          Message: JSON.stringify(mapMIToCloudEvent(miEvent)),
        }),
      ),
    ];

    await handler(
      generateKinesisEvent(miEvents),
      mockDeep<Context>(),
      jest.fn(),
    );

    expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries[0],
        }),
      }),
    );
    expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries[1],
        }),
      }),
    );

    expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries[2],
        }),
      }),
    );
  });
});
