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

// mock service
jest.mock('../../services/letter-operations');
import * as letterService from '../../services/letter-operations';
const mockedPatchLetterStatus = jest.mocked(letterService.patchLetterStatus);

// mock mapper
jest.mock('../../mappers/error-mapper');
import { mapErrorToResponse } from '../../mappers/error-mapper';
const mockedMapErrorToResponse = jest.mocked(mapErrorToResponse);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: 'Error'
};
mockedMapErrorToResponse.mockReturnValue(expectedErrorResponse);

import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import { PatchLetterRequest, PatchLetterResponse } from '../../contracts/letters';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';
import { S3Client } from '@aws-sdk/client-s3';
import pino from 'pino';
import { LetterRepository } from '../../../../../internal/datastore/src';
import { LambdaEnv } from '../../config/env';
import { patchLetter } from '../patch-letter';

const updateLetterStatusRequest : PatchLetterRequest = {
    data: {
      id: 'id1',
      type: 'Letter',
      attributes: {
        status: 'REJECTED',
        reasonCode: 123,
        reasonText: 'Reason text',
      }
    }
};

const requestBody = JSON.stringify(updateLetterStatusRequest, null, 2);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('patchLetter API Handler', () => {

  it('returns 200 OK with updated resource', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: 'id1'},
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const updateLetterServiceResponse : PatchLetterResponse = {
        data: {
          id: 'id1',
          type: 'Letter',
          attributes: {
            status: 'REJECTED',
            specificationId: 'spec1',
            groupId: 'group1',
            reasonCode: 123,
            reasonText: 'Reason text',
          }
        }
    };
    mockedPatchLetterStatus.mockResolvedValue(updateLetterServiceResponse);

    const result = await patchLetter(event, context, callback);

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(updateLetterServiceResponse, null, 2)
    });
  });

  it('returns error response when there is no body', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      pathParameters: {id: 'id1'},
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingBody), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when path parameter letterId is not found', async () => {
    const event = makeApiGwEvent({
      path: '/letters/',
      body: requestBody,
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when error is thrown by service', async () => {
    const error = new Error('Service error');
    mockedPatchLetterStatus.mockRejectedValue(error);

    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: 'id1'},
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(error, 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error when supplier id is missing', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: 'id1'},
      headers: {'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingSupplierId), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error when request body does not have correct shape', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: "{test: 'test'}",
      pathParameters: {id: 'id1'},
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestBody), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error when request body is not json', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: '{#invalidJSON',
      pathParameters: {id: 'id1'},
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestBody), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if unexpected error is thrown', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: 'somebody',
      pathParameters: {id: 'id1'},
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const error = 'Unexpected error';
    const spy = jest.spyOn(JSON, 'parse').mockImplementation(() => {
      throw error;
    });

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(error, 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);

    spy.mockRestore();
  });

  it('returns error if correlation id not provided in request', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: 'id1'},
      headers: {'nhsd-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined, mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns 400 for missing supplier ID (empty headers)', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: 'id1'},
      headers: {}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetter(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('The request headers are empty'), undefined, mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });
});
