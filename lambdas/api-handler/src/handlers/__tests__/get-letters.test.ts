// mock error mapper
jest.mock('../../mappers/error-mapper');
import { mapErrorToResponse } from '../../mappers/error-mapper';
const mockedMapErrorToResponse = jest.mocked(mapErrorToResponse);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: 'Error'
};
mockedMapErrorToResponse.mockReturnValue(expectedErrorResponse);

//mock letter service
jest.mock('../../services/letter-operations');
import * as letterService from '../../services/letter-operations';

import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';
import { S3Client } from '@aws-sdk/client-s3';
import pino from 'pino';
import { LetterRepository } from '@internal/datastore/src';
import { createGetLettersHandler } from '../get-letters';
import { Deps } from '../../config/deps';
import { EnvVars } from '../../config/env';

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
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 OK with basic paginated resources', async () => {

    const mockedGetLetters = letterService.getLettersForSupplier as jest.Mock;
    mockedGetLetters.mockResolvedValue([
      {
        id: 'l1',
        specificationId: 's1',
        groupId: 'g1',
        status: 'PENDING'
      },
      {
        id: 'l2',
        specificationId: 's1',
        groupId: 'g1',
        status: 'PENDING',
      },
      {
        id: 'l3',
        specificationId: 's1',
        groupId: 'g1',
        status: 'PENDING',
        reasonCode: 123, // shouldn't be returned if present
        reasonText: 'Reason text' // shouldn't be returned if present
      },
    ]);

    const event = makeApiGwEvent({
      path: '/letters',
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedGetLetters).toHaveBeenCalledWith('supplier1', 'PENDING', mockedDeps.env.MAX_LIMIT, mockedDeps.letterRepo);

    const expected = {
      data: [
        {
          id: 'l1',
          type: 'Letter',
          attributes: { status: 'PENDING', specificationId: 's1', groupId: 'g1' },
        },
        {
          id: 'l2',
          type: 'Letter',
          attributes: { status: 'PENDING', specificationId: 's1', groupId: 'g1' },
        },
        {
          id: 'l3',
          type: 'Letter',
          attributes: { status: 'PENDING', specificationId: 's1', groupId: 'g1' }
        }
      ],
    };

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(expected, null, 2),
    });
  });

  it('returns 200 OK with a valid limit', async () => {

    const mockedGetLetters = letterService.getLettersForSupplier as jest.Mock;
    mockedGetLetters.mockResolvedValue([
      {
        id: 'l1',
        specificationId: 's1',
        groupId: 'g1',
        status: 'PENDING'
      },
    ]);

    const event = makeApiGwEvent({
      path: '/letters',
      queryStringParameters: { limit: '50' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedGetLetters).toHaveBeenCalledWith('supplier1', 'PENDING', 50, mockedDeps.letterRepo);

    const expected = {
      data: [
        {
          id: 'l1',
          type: 'Letter',
          attributes: { status: 'PENDING', specificationId: 's1', groupId: 'g1' },
        },
      ],
    };

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(expected, null, 2),
    });
  });

  it('returns error if the limit parameter is not a number', async () => {

    const event = makeApiGwEvent({
      path: '/letters',
      queryStringParameters: { limit: '1%' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);


    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotANumber), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if the limit parameter is negative', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      queryStringParameters: { limit: '-1' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(
      new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [mockedDeps.env.MAX_LIMIT] }), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if the limit parameter is zero', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      queryStringParameters: { limit: '0' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(
      new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [mockedDeps.env.MAX_LIMIT] }), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if the limit parameter is higher than max limit', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      queryStringParameters: { limit: '2501' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(
      new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [mockedDeps.env.MAX_LIMIT] }), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if unknown parameters are present', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      queryStringParameters: { max: '2000' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitOnly), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if headers are empty', async () => {
    const event = makeApiGwEvent({ path: '/letters', headers: {} });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('The request headers are empty'), undefined, mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if correlation id not provided in request', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      queryStringParameters: { limit: '2000' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLettersHandler = createGetLettersHandler(mockedDeps);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined, mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if max limit is not set', async () => {
    const event = makeApiGwEvent({path: '/letters',
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const mockedDepsNoMaxLimit = {
      ...mockedDeps,
      env: { ...mockedDeps.env },
    };
    delete mockedDepsNoMaxLimit.env.MAX_LIMIT;

    const getLettersHandler = createGetLettersHandler(mockedDepsNoMaxLimit);
    const result = await getLettersHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('MAX_LIMIT is required for getLetters'), 'correlationId', mockedDepsNoMaxLimit.logger);
    expect(result).toEqual(expectedErrorResponse);
  });
});
