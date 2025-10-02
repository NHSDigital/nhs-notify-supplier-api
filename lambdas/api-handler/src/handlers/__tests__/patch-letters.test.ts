import { patchLetters } from '../../index';
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import * as letterService from '../../services/letter-operations';
import { PatchLetterRequest, PatchLetterResponse } from '../../contracts/letters';
import { mapErrorToResponse } from '../../mappers/error-mapper';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';

jest.mock('../../services/letter-operations');
jest.mock('../../mappers/error-mapper');

jest.mock('../../config/lambda-config', () => ({
  lambdaConfig: {
    SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
    APIM_CORRELATION_HEADER: 'nhsd-correlation-id'
  }
}));

const mockedMapErrorToResponse = jest.mocked(mapErrorToResponse);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: 'Error'
};
mockedMapErrorToResponse.mockReturnValue(expectedErrorResponse);

const mockedPatchLetterStatus = jest.mocked(letterService.patchLetterStatus);

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

describe('patchLetters API Handler', () => {

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

    const result = await patchLetters(event, context, callback);

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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingBody), 'correlationId');
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
    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter), 'correlationId');
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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(error, 'correlationId');
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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingSupplierId), 'correlationId');
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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestBody), 'correlationId');
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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestBody), 'correlationId');
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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(error, 'correlationId');
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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined);
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

    const result = await patchLetters(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('The request headers are empty'), undefined);
    expect(result).toEqual(expectedErrorResponse);
  });
});
