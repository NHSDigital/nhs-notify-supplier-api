import { getLetters } from '../../index';
import type { Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';

describe('API Lambda handler', () => {
  it('returns 200 OK with "Here are some letters: [L1, L2, L3]" for the root path', async () => {
    const event = { path: '/letters' };
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 200,
      body: 'Here are some letters: [L1, L2, L3]',
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
