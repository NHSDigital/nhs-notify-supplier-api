import { patchLetters } from '../../index';
import type { Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';

const requestBody = {
  "data": {
    "attributes": {
      "reasonCode": 100,
      "reasonText": "failed validation",
      "requestedProductionStatus": "ACTIVE",
      "status": "REJECTED"
    },
    "id": "id1",
    "type": "Letter"
  }
};

const requestBodyString = JSON.stringify(requestBody, null, 2);

describe('API Lambda handler', () => {
  it('returns 200 OK with updated resource', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      body: requestBodyString,
      pathParameters: {id: "id1"}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 200,
      body: requestBodyString,
    });
  });

  it('returns 400 Bad Request as there is no body', async () => {
    const event = makeApiGwEvent({
      path: '/letters/id1',
      pathParameters: {id: "id1"}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 400,
      body: 'Bad Request',
    });
  });

  it('returns 404 Not Found as path is unknown', async () => {
    const event = makeApiGwEvent({
      path: '/unknown',
      body: requestBodyString,
      pathParameters: {id: "id1"}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 404,
      body: 'Not Found',
    });
  });

  it('returns 404 Not Found as path parameter is not found', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      body: requestBodyString});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await patchLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 404,
      body: 'Not Found',
    });
  });

});
