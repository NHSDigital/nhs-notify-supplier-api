import { getLetters } from '../../index';
import type { Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import * as letterService from '../../services/letter-operations';

jest.mock('../../services/letter-operations');

describe('API Lambda handler', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 200 OK with basic paginated resources', async () => {

    const mockedGetLetterIds = letterService.getLetterIdsForSupplier as jest.Mock;
    mockedGetLetterIds.mockResolvedValue(['l1', 'l2', 'l3']);

    const event = makeApiGwEvent({path: '/letters', headers: {'app-supplier-id': 'supplier1'}});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    const expected = {
      "links": {
        "self": "/letters?page=1",
        "first": "/letters?page=1",
        "last": "/letters?page=1",
        "next": "/letters?page=1",
        "prev": "/letters?page=1"
      },
      "data": [
        { "type": "letter", "id": "l1" },
        { "type": "letter", "id": "l2" },
        { "type": "letter", "id": "l3" }
      ]
    }

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(expected, null, 2),
    });
  });

  it('returns 404 Not Found for an unknown path', async () => {
    const event = makeApiGwEvent({ path: '/unknown' });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 404,
      body: 'Not Found',
    });
  });

  it('returns 400 Bad Request: Missing supplier ID if header app-supplier-id ', async () => {
    const event = makeApiGwEvent({path: '/letters'});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 400,
      body: 'Bad Request: Missing supplier ID',
    });
  });
});
