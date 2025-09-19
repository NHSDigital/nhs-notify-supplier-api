import { getLetters } from '../../index';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import * as letterService from '../../services/letter-operations';
import { mapErrorToResponse } from '../../mappers/error-mapper';
import { getEnvars } from '../get-letters';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';

jest.mock('../../mappers/error-mapper');
const mockedMapErrorToResponse = jest.mocked(mapErrorToResponse);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: "Error"
};
mockedMapErrorToResponse.mockReturnValue(expectedErrorResponse);

jest.mock('../../services/letter-operations');

jest.mock("../../config/lambda-config", () => ({
  lambdaConfig: {
    SUPPLIER_ID_HEADER: "nhsd-supplier-id"
  }
}));

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
    expect(getEnvars().maxLimit).toBe(2500);
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
        reasonCode: 123,
        reasonText: "Reason text"
      },
    ]);

    const event = makeApiGwEvent({path: '/letters', headers: {'nhsd-supplier-id': 'supplier1'}});
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
          attributes: { status: "PENDING", specificationId: "s1", groupId: 'g1', reasonCode: 123, reasonText: "Reason text" }
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
      headers: {'nhsd-supplier-id': 'supplier1'}});

    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotANumber));
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if the limit parameter is negative", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "-1" },
      headers: {'nhsd-supplier-id': 'supplier1'}});

    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [getEnvars().maxLimit] }));
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if the limit parameter is zero", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "0" },
      headers: {'nhsd-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [getEnvars().maxLimit] }));
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if the limit parameter is higher than max limit", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { limit: "2501" },
      headers: {'nhsd-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [getEnvars().maxLimit] }));
    expect(result).toEqual(expectedErrorResponse);
  });

  it("returns 400 if unknown parameters are present", async () => {
    const event = makeApiGwEvent({
      path: "/letters",
      queryStringParameters: { max: "2000" },
      headers: {'nhsd-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitOnly));
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns 400 for missing supplier ID (empty headers)', async () => {
    const event = makeApiGwEvent({ path: "/letters", headers: {} });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingSupplierId));
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns 400 for missing supplier ID (undefined headers)', async () => {
    const event = makeApiGwEvent({ path: "/letters", headers: undefined });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingSupplierId));
    expect(result).toEqual(expectedErrorResponse);
  });
});
