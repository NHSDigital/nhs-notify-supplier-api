import { patchLetters } from '../../index';
import type { Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import * as letterService from '../../services/letter-operations';
import { NotFoundError, ValidationError } from '../../errors';
import { LetterApiDocument, LetterApiStatus } from '../../contracts/letter-api';

jest.mock('../../services/letter-operations');

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

const letterApiDocument = makeLetterApiDocument("id1", "REJECTED");

const requestBody = JSON.stringify(letterApiDocument, null, 2);

describe('patchLetters API Handler', () => {
  it('returns 200 OK with updated resource', async () => {

    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"},
      headers: {'app-supplier-id': 'supplier1'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const mockedPatchLetterStatus = letterService.patchLetterStatus as jest.Mock;
    mockedPatchLetterStatus.mockResolvedValue(letterApiDocument);

    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 200,
      body: requestBody,
    });
  });

  it('returns 400 Bad Request as there is no body', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      pathParameters: {id: "id1"},
      headers: {'app-supplier-id': 'supplier1'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 400,
      body: 'Bad Request: Missing request body',
    });
  });

  it('returns 404 Not Found as path parameter is not found', async () => {
    const event = makeApiGwEvent({
      path: '/letters/',
      body: requestBody,
      headers: {'app-supplier-id': 'supplier1'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 404,
      body: 'Not Found: The requested resource does not exist',
    });
  });

  it('returns 400 Bad Request when ValidationError is thrown by service', async () => {
    const mockedPatchLetterStatus = letterService.patchLetterStatus as jest.Mock;
    mockedPatchLetterStatus.mockRejectedValue(new ValidationError('Validation failed'));

    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"},
      headers: {'app-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 400,
      body: 'Validation failed'
    });
  });

  it('returns 404 Not Found when NotFoundError is thrown by service', async () => {
    const mockedPatchLetterStatus = letterService.patchLetterStatus as jest.Mock;
    mockedPatchLetterStatus.mockRejectedValue(new NotFoundError('Letter not found'));

    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"},
      headers: {'app-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 404,
      body: 'Letter not found'
    });
  });

  it('throws unexpected errors from service', async () => {
    const mockedPatchLetterStatus = letterService.patchLetterStatus as jest.Mock;
    mockedPatchLetterStatus.mockRejectedValue(new Error('Unexpected error'));

    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"},
      headers: {'app-supplier-id': 'supplier1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    await expect(patchLetters(event, context, callback)).rejects.toThrow('Unexpected error');
  });

  it('returns 400 Bad Request: Missing supplier ID if header app-supplier-id ', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBody,
      pathParameters: {id: "id1"}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 400,
      body: 'Bad Request: Missing supplier ID',
    });
  });
});
