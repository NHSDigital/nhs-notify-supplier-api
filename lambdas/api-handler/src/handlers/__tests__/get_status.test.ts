import { S3Client } from "@aws-sdk/client-s3";
import { DBHealthcheck } from "../../../../../internal/datastore/src";
import pino from "pino";
import { Deps } from "../../config/deps";
import { makeApiGwEvent } from "./utils/test-utils";
import { mockDeep } from "jest-mock-extended";
import { Context } from "aws-lambda";
import { createGetStatusHandler } from "../get-status";

describe('API Lambda handler', () => {
  it('passes if S3 and DynamoDB are available', async() => {

    const event = makeApiGwEvent({path: '/_status',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    const getLetterDataHandler = createGetStatusHandler(getMockedDeps());
    const result = await getLetterDataHandler(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual({
      statusCode: 200,
      body: '{}',
    });
  });

  it('fails if S3 is unavailable', async() => {
    const mockedDeps = getMockedDeps();
    mockedDeps.s3Client.send = jest.fn().mockRejectedValue(new Error('unexpected error'));

    const event = makeApiGwEvent({path: '/_status',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    const getLetterDataHandler = createGetStatusHandler(mockedDeps);
    const result = await getLetterDataHandler(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));
  });


  it('fails if DynamoDB is unavailable', async() => {
    const mockedDeps = getMockedDeps();
    mockedDeps.dbHealthcheck.check = jest.fn().mockRejectedValue(new Error('unexpected error'));

    const event = makeApiGwEvent({path: '/_status',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    const getLetterDataHandler = createGetStatusHandler(mockedDeps);
    const result = await getLetterDataHandler(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));
  });

  it('fails if request ID is absent', async() => {
    const event = makeApiGwEvent({path: '/_status',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });

    const getLetterDataHandler = createGetStatusHandler(getMockedDeps());
    const result = await getLetterDataHandler(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));
  });

  function getMockedDeps(): jest.Mocked<Deps> {
    return {
      s3Client: { send: jest.fn()} as unknown as S3Client,
      dbHealthcheck: {check: jest.fn()} as unknown as DBHealthcheck,
      logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
      env: {
        SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
        APIM_CORRELATION_HEADER: 'nhsd-correlation-id'
      }
    } as Deps;
  }
});
