import { getLetters } from '../../index';
import type { Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';

describe('API Lambda handler', () => {
  it('returns 200 OK with basic paginated resources', async () => {
    const event = { path: '/letters' };
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
      body: JSON.stringify(expected),
    });
  });

  it('returns 404 Not Found for an unknown path', async () => {
    const event = { path: '/unknown' };
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 404,
      body: 'Not Found',
    });
  });
});
