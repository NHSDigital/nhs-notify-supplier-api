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

// mock dependencies
jest.mock("../../config/deps", () => ({ getDeps: jest.fn() }));
import { Deps, getDeps } from "../../config/deps";
const mockedGetDeps = getDeps as jest.Mock<Deps>;
const fakeDeps: jest.Mocked<Deps> = {
  s3Client: {} as unknown as S3Client,
  letterRepo: {} as unknown as LetterRepository,
  logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
  env: {
    SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
    APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
    LETTERS_TABLE_NAME: 'LETTERS_TABLE_NAME',
    LETTER_TTL_HOURS: 'LETTER_TTL_HOURS'
  } as unknown as LambdaEnv
}
mockedGetDeps.mockReturnValue(fakeDeps);

import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';
import { getLetterData } from '../get-letter-data';
import { S3Client } from '@aws-sdk/client-s3';
import pino from 'pino';
import { LetterRepository } from '../../../../../internal/datastore/src';
import { LambdaEnv } from '../../config/env';

describe('API Lambda handler', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns 303 Found with a pre signed url', async () => {

    const mockedGetLetterDataUrlService = letterService.getLetterDataUrl as jest.Mock;
    mockedGetLetterDataUrlService.mockResolvedValue('https://somePreSignedUrl.com');

    const event = makeApiGwEvent({path: '/letters/letter1/data',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'},
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(result).toEqual({
      statusCode: 303,
      headers: {
        'Location': 'https://somePreSignedUrl.com',
      },
      body: ''
    });
  });

  it('returns 400 for missing supplier ID (empty headers)', async () => {
    const event = makeApiGwEvent({ path: '/letters/letter1/data', headers: {},
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('The request headers are empty'), undefined, mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns 500 if correlation id not provided in request', async () => {
    const event = makeApiGwEvent({
      path: '/letters/letter1/data',
      queryStringParameters: { limit: '2000' },
      headers: {'nhsd-supplier-id': 'supplier1'},
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined, mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when path parameter letterId is not found', async () => {
    const event = makeApiGwEvent({
      path: '/letters/',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });
});
