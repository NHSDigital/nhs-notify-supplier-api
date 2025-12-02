import { KinesisClient } from "@aws-sdk/client-kinesis";
import * as pino from "pino";
import { mockDeep } from "jest-mock-extended";
import { Context, DynamoDBStreamEvent } from "aws-lambda";
import { Deps } from "../deps";
import { EnvVars } from "../env";
import createHandler from "../mi-stream-forwarder";

describe("mi-stream-forwarder Lambda", () => {
  const mockedDeps: jest.Mocked<Deps> = {
    kinesisClient: { send: jest.fn() } as unknown as KinesisClient,
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as pino.Logger,
    env: {
      MI_CHANGE_STREAM_ARN: "test-stream",
    } as unknown as EnvVars,
  } as Deps;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards INSERT records to Kinesis", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "INSERT",
          dynamodb: {
            NewImage: { id: { S: "mi-123" }, foo: { S: "bar" } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());
    expect(mockedDeps.kinesisClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          StreamARN: "test-stream",
          PartitionKey: "mi-123",
        }),
      }),
    );
  });

  it("does not forward non-INSERT records", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "MODIFY",
          dynamodb: {
            NewImage: { id: { S: "mi-123" }, foo: { S: "baz" } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());
    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });
});
