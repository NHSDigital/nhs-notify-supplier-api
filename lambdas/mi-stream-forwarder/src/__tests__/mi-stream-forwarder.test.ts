import { KinesisClient } from '@aws-sdk/client-kinesis';
import { mockDeep } from 'jest-mock-extended';
import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { Deps } from '../deps';
import { EnvVars } from '../env';
import { createHandler } from '../mi-stream-forwarder';


describe('mi-stream-forwarder Lambda', () => {

  const mockedDeps: jest.Mocked<Deps> = {
    kinesisClient: { send: jest.fn()} as unknown as KinesisClient,
    env: {
      MI_CHANGE_STREAM_NAME: "test-stream",
    } as unknown as EnvVars
  } as Deps;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards INSERT records to Kinesis', async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: 'INSERT',
          dynamodb: {
            NewImage: { id: { S: 'mi-123' }, foo: { S: 'bar' } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());
    expect(mockedDeps.kinesisClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          StreamName: 'test-stream',
          PartitionKey: 'mi-123',
        }),
      })
    );
  });

  it('does not forward non-INSERT records', async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: 'MODIFY',
          dynamodb: {
            NewImage: { id: { S: 'mi-123' }, foo: { S: 'baz' } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());
    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });
});
