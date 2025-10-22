import { Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import * as letterService from '../../services/letter-operations';
import { makeApiGwEvent } from './utils/test-utils';
import { ApiErrorDetail } from '../../contracts/errors';
import { NotFoundError } from '../../errors';
import { S3Client } from '@aws-sdk/client-s3';
import pino from 'pino';
import { LetterRepository } from '../../../../../internal/datastore/src';
import { Deps } from '../../config/deps';
import { EnvVars } from '../../config/env';
import { createGetLetterHandler } from '../get-letter';

jest.mock('../../services/letter-operations');


describe('API Lambda handler', () => {

  const mockedDeps: jest.Mocked<Deps> = {
    s3Client: {} as unknown as S3Client,
    letterRepo: {} as unknown as LetterRepository,
    logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
      APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
      LETTERS_TABLE_NAME: 'LETTERS_TABLE_NAME',
      LETTER_TTL_HOURS: 12960,
      DOWNLOAD_URL_TTL_SECONDS: 60,
      MAX_LIMIT: 2500
    } as unknown as EnvVars
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns 200 OK and the letter status', async () => {

    const mockedGetLetterById = letterService.getLetterById as jest.Mock;
    mockedGetLetterById.mockResolvedValue({
      id: 'id1',
      specificationId: 'spec1',
      groupId: 'group1',
      status: 'PENDING'
    });

    const event = makeApiGwEvent({path: '/letters/id1',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'},
      pathParameters: {id: 'id1'}});

    const getLetter = createGetLetterHandler(mockedDeps);
    const result = await getLetter(event, mockDeep<Context>(), jest.fn());

    const expected = {
      data: {
        id: 'id1',
        type: 'Letter',
        attributes: {
          status: 'PENDING',
          specificationId: 'spec1',
          groupId: 'group1'
        }
      }
    };

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(expected, null, 2),
    });
  });

  it('includes the reason code and reason text if present', async () => {

    const mockedGetLetterById = letterService.getLetterById as jest.Mock;
    mockedGetLetterById.mockResolvedValue({
      id: 'id1',
      specificationId: 'spec1',
      groupId: 'group1',
      status: 'FAILED',
      reasonCode: 100,
      reasonText: 'failed validation'
    });

    const event = makeApiGwEvent({path: '/letters/id1',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'},
      pathParameters: {id: 'id1'}});

    const getLetter = createGetLetterHandler(mockedDeps);
    const result = await getLetter(event, mockDeep<Context>(), jest.fn());

    const expected = {
      data: {
        id: 'id1',
        type: 'Letter',
        attributes: {
          status: 'FAILED',
          specificationId: 'spec1',
          groupId: 'group1',
          reasonCode: 100,
          reasonText: 'failed validation'
        }
      }
    };

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(expected, null, 2),
    });
  });

    it('returns 404 Not Found when letter matching id is not found', async () => {

      const mockedGetLetterById = letterService.getLetterById as jest.Mock;
      mockedGetLetterById.mockImplementation(() => {
        throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
      });

      const event = makeApiGwEvent({path: '/letters/id1',
        headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'},
        pathParameters: {id: 'id1'}});

      const getLetter = createGetLetterHandler(mockedDeps);
      const result = await getLetter(event, mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 404,
    }));
  });

  it ('returns 500 when correlation id is missing from header', async() => {
      const event = makeApiGwEvent({path: '/letters/id1',
        headers: {'nhsd-supplier-id': 'supplier1', 'x-request-id': 'requestId'},
        pathParameters: {id: 'id1'}});

      const getLetter = createGetLetterHandler(mockedDeps);
      const result = await getLetter(event, mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 500,
    }));
  });

  it ('returns 500 when supplier id is missing from header', async() => {
      const event = makeApiGwEvent({path: '/letters/id1',
        headers: {'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'},
        pathParameters: {id: 'id1'}});

      const getLetter = createGetLetterHandler(mockedDeps);
      const result = await getLetter(event, mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 500,
    }));
  });


  it ('returns 400 when letter id is missing from path', async() => {
      const event = makeApiGwEvent({path: '/letters/id1',
        headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}});

      const getLetter = createGetLetterHandler(mockedDeps);
      const result = await getLetter(event, mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 400,
    }));
  });
});
