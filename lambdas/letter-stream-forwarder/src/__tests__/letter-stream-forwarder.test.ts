import { KinesisClient } from '@aws-sdk/client-kinesis';
import { mockDeep } from 'jest-mock-extended';
import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { Deps } from '../deps';
import { EnvVars } from '../env';
import { createHandler } from '../letter-stream-forwarder';

describe('letter-stream-forwarder Lambda', () => {

  const mockedDeps: jest.Mocked<Deps> = {
    kinesisClient: { send: jest.fn()} as unknown as KinesisClient,
    env: {
      LETTER_CHANGE_STREAM_NAME: "test-stream",
    } as unknown as EnvVars
  } as Deps;

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('forwards status changes to Kinesis', async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: 'MODIFY',
          dynamodb: {
            Keys: { id: { S: '123' } },
            OldImage: { status: { S: 'PENDING' } },
            NewImage: { status: { S: 'ACCEPTED' }, id: { S: '123' } },
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
          PartitionKey: '123',
        }),
      })
    );
  });

  it('does not forward if status did not change', async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: 'MODIFY',
          dynamodb: {
            Keys: { id: { S: '123' } },
            OldImage: { status: { S: 'PENDING' } },
            NewImage: { status: { S: 'PENDING' }, id: { S: '123' } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });

  it('does not forward non-MODIFY events', async () => {
    const event: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: 'INSERT',
          dynamodb: {
            Keys: { id: { S: '123' } },
            NewImage: { status: { S: 'PENDING' }, id: { S: '123' } },
          },
        },
      ],
    };

    const handler = createHandler(mockedDeps);
    await handler(event, mockDeep<Context>(), jest.fn());

    expect(mockedDeps.kinesisClient.send).not.toHaveBeenCalled();
  });
});
