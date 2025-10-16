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
    LETTER_TTL_HOURS: 'LETTER_TTL_HOURS',
    DOWNLOAD_URL_TTL_SECONDS: 'DOWNLOAD_URL_TTL_SECONDS'
  } as unknown as LambdaEnv
}
mockedGetDeps.mockReturnValue(fakeDeps);

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
import { getMaxLimit } from '../get-letters';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';
import { S3Client } from '@aws-sdk/client-s3';
import pino from 'pino';
import { LetterRepository } from '../../../../../internal/datastore/src';
import { LambdaEnv } from '../../config/env';
import { getLetters } from "../get-letters";

describe('API Lambda handler', () => {

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    process.env = { ...originalEnv };
    process.env.MAX_LIMIT = '2500';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses process.env.MAX_LIMIT for max limit set', async () => {
    expect(getMaxLimit().maxLimit).toBe(2500);
  });

  it('returns 200 OK with basic paginated resources', async () => {

    const mockedGetLetters = letterService.getLettersForSupplier as jest.Mock;
    mockedGetLetters.mockResolvedValue([
      {
        id: "l1",
        specificationId: "s1",
        groupId: 'g1',
        status: "PENDING"
      },
      {
        id: "l2",
        specificationId: "s1",
        groupId: 'g1',
        status: "PENDING",
      },
      {
        id: "l3",
        specificationId: "s1",
        groupId: 'g1',
        status: "PENDING",
        reasonCode: 123, // shouldn't be returned if present
        reasonText: "Reason text" // shouldn't be returned if present
      },
    ]);

    const event = makeApiGwEvent({path: '/letters',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetters(event, context, callback);

    const expected = {
      data: [
        {
          id: "l1",
          type: "Letter",
          attributes: { status: "PENDING", specificationId: "s1", groupId: 'g1' },
        },
        {
          id: "l2",
          type: "Letter",
          attributes: { status: "PENDING", specificationId: "s1", groupId: 'g1' },
        },
        {
          id: "l3",
          type: "Letter",
          attributes: { status: "PENDING", specificationId: "s1", groupId: 'g1' }
        }
      ],
    };

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(expected, null, 2),
    });
  });

  it("returns 400 if the limit parameter is not a number", async () => {

    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "1%" },
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });

    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotANumber), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if the limit parameter is negative", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "-1" },
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });

    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(
      new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [getMaxLimit().maxLimit] }), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if the limit parameter is zero", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "0" },
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(
      new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [getMaxLimit().maxLimit] }), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if the limit parameter is higher than max limit", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "2501" },
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(
      new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [getMaxLimit().maxLimit] }), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if unknown parameters are present", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { max: "2000" },
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitOnly), 'correlationId', mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns 400 for missing supplier ID (empty headers)', async () => {
    const event = makeApiGwEvent({ path: "/letters", headers: {} });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('The request headers are empty'), undefined, mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 500 if correlation id not provided in request", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "2000" },
      headers: {'nhsd-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined, mockedGetDeps().logger);
    expect(result).toEqual(expectedErrorResponse);
  });
});
