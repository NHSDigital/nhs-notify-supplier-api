// mock error mapper
jest.mock('../../mappers/error-mapper');
import { mapErrorToResponse } from '../../mappers/error-mapper';
const mockedMapErrorToResponse = jest.mocked(mapErrorToResponse);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: 'Error'
};
mockedMapErrorToResponse.mockReturnValue(expectedErrorResponse);

// mock letterService
jest.mock('../../services/letter-operations');
import * as letterService from '../../services/letter-operations';

import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';
import { createGetLetterDataHandler } from '../get-letter-data';
import { S3Client } from '@aws-sdk/client-s3';
import pino from 'pino';
import { LetterRepository } from '@internal/datastore/src';
import { EnvVars } from '../../config/env';
import { Deps } from "../../config/deps";

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
      DOWNLOAD_URL_TTL_SECONDS: 60
    } as unknown as EnvVars
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 303 Found with a pre signed url', async () => {

    const mockedGetLetterDataUrlService = letterService.getLetterDataUrl as jest.Mock;
    mockedGetLetterDataUrlService.mockResolvedValue('https://somePreSignedUrl.com');

    const event = makeApiGwEvent({
      path: '/letters/letter1/data',
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      },
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLetterDataHandler = createGetLetterDataHandler(mockedDeps);
    const result = await getLetterDataHandler(event, context, callback);

    expect(result).toEqual({
      statusCode: 303,
      headers: {
        'Location': 'https://somePreSignedUrl.com',
      },
      body: ''
    });
  });

  it('returns error if headers are empty', async () => {
    const event = makeApiGwEvent({ path: '/letters/letter1/data', headers: {},
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLetterDataHandler = createGetLetterDataHandler(mockedDeps);
    const result = await getLetterDataHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('The request headers are empty'), undefined, mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if correlation id not provided in request', async () => {
    const event = makeApiGwEvent({
      path: '/letters/letter1/data',
      queryStringParameters: { limit: '2000' },
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'x-request-id': 'requestId'
      },
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLetterDataHandler = createGetLetterDataHandler(mockedDeps);
    const result = await getLetterDataHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined, mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when path parameter letterId is not found', async () => {
    const event = makeApiGwEvent({
      path: '/letters/',
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      },
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const getLetterDataHandler = createGetLetterDataHandler(mockedDeps);
    const result = await getLetterDataHandler(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });
});
