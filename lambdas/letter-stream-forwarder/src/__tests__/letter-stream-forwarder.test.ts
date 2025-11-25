import { KinesisClient } from "@aws-sdk/client-kinesis";
import * as pino from "pino";
import { mockDeep } from "jest-mock-extended";
import { DynamoDBStreamEvent, Context } from "aws-lambda";
import { Deps } from "../deps";
import { EnvVars } from "../env";
import { createHandler } from "../letter-stream-forwarder";

describe("letter-stream-forwarder Lambda", () => {

  const mockedDeps: jest.Mocked<Deps> = {
    kinesisClient: { send: jest.fn()} as unknown as KinesisClient,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      LETTER_CHANGE_STREAM_ARN: "test-stream.arn",
    } as unknown as EnvVars
  } as Deps;

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it("forwards status changes to Kinesis", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "MODIFY",
          dynamodb: {
            Keys: { id: { S: "123" } },
            OldImage: buildValidLetter(),
            NewImage: {...buildValidLetter(), status: { S: "ACCEPTED" } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          StreamARN: "test-stream.arn",
          PartitionKey: "123",
        }),
      })
    );
  });


  it("does not forward invalid status changes", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "MODIFY",
          dynamodb: {
            Keys: { id: { S: "123" } },
            OldImage: {...buildValidLetter(), status: { S: "CANCELLED" } },
            NewImage: {...buildValidLetter(), status: { S: "PRINTED" } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });

  it("forwards to Kinesis if a reason code is added", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "MODIFY",
          dynamodb: {
            Keys: { id: { S: "123" } },
            OldImage: buildValidLetter(),
            NewImage: {...buildValidLetter(),  reasonCode: {S: "r1"} },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          StreamARN: "test-stream.arn",
          PartitionKey: "123",
        }),
      })
    );
  });


  it("forwards to Kinesis if a reason code is changed", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "MODIFY",
          dynamodb: {
            Keys: { id: { S: "123" } },
            OldImage: {...buildValidLetter(), reasonCode: {S: "r1"} },
            NewImage: {...buildValidLetter(), reasonCode: {S: "r2"} },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          StreamARN: "test-stream.arn",
          PartitionKey: "123",
        }),
      })
    );
  });

  it("does not forward if neither status nor reason code changed", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "MODIFY",
          dynamodb: {
            Keys: { id: { S: "123" } },
            OldImage: buildValidLetter(),
            NewImage: buildValidLetter(),
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });

  it("does not forward non-MODIFY events", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "INSERT",
          dynamodb: {
            Keys: { id: { S: "123" } },
            NewImage: buildValidLetter(),
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });


  it("does not forward invalid letter data", async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "MODIFY",
          dynamodb: {
            Keys: { id: { S: "123" } },
            OldImage: buildInvalidLetter(),
            NewImage: {...buildInvalidLetter(), status: { S: "ACCEPTED" } },
          },
        }
      ],
    };

    const handler = createHandler(mockedDeps);
    await expect(handler(event, mockDeep<Context>(), jest.fn())).rejects.toThrow();

    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });

  function buildValidLetter() {
    return {
      id: {S: "123"},
      status: {S: "PENDING"},
      specificationId: {S: "spec1"},
      groupId: {S: "group1"},
    };
  }

  function buildInvalidLetter() {
    return {
      id: {S: "123"},
      status: {S: "PENDING"},
    };
  }
});
