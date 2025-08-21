import { patchLetters } from '../../index';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import * as letterService from '../../services/letter-operations';
import { NotFoundError, ValidationError } from '../../errors';
import { LetterApiDocument, LetterApiStatus } from '../../contracts/letter-api';
import { ErrorResponse, mapErrorToResponse } from '../../mappers/error-mapper';

jest.mock('../../services/letter-operations');
jest.mock('../../mappers/error-mapper');

const mockedMapErrorToResponse = jest.mocked(mapErrorToResponse);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: "Error"
};
mockedMapErrorToResponse.mockReturnValue(expectedErrorResponse);

const mockedPatchLetterStatus = jest.mocked(letterService.patchLetterStatus);

const letterApiDocument = makeLetterApiDocument("id1", "REJECTED");
const requestBody = JSON.stringify(letterApiDocument, null, 2);

function makeLetterApiDocument(id: string, status: LetterApiStatus) : LetterApiDocument {
  return {
    data: {
      attributes: {
        reasonCode: 123,
        reasonText: "Reason text",
        requestedProductionStatus: "ACTIVE",
        status
      },
      id,
      type: "Letter"
    }
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('patchLetters API Handler', () => {

  it('returns 200 OK with updated resource', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"},
      headers: {'nhsd-supplier-id': 'supplier1'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();

    mockedPatchLetterStatus.mockResolvedValue(letterApiDocument);

    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 200,
      body: requestBody,
    });
  });

  it('returns error response when there is no body', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      pathParameters: {id: "id1"},
      headers: {'nhsd-supplier-id': 'supplier1'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetters(event, context, callback);

    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when path parameter letterId is not found', async () => {
    const event = makeApiGwEvent({
      path: '/letters/',
      body: requestBody,
      headers: {'nhsd-supplier-id': 'supplier1'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when error is thrown by service', async () => {
    mockedPatchLetterStatus.mockRejectedValue(new Error('Service error'));

    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"},
      headers: {'nhsd-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetters(event, context, callback);

    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error when nhsd-supplier-id is missing', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"}});
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetters(event, context, callback);

    expect(result).toEqual(expectedErrorResponse);
  });
});
