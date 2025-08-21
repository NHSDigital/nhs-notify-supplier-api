import { helloWorld } from '../../index';
import type { Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';

jest.mock("../../config/lambda-config", () => ({
  lambdaConfig: {
    SUPPLIER_ID_HEADER: "nhsd-supplier-id"
  }
}));

describe('API Lambda handler', () => {
  it('returns 200 OK with "Hello World" for the root path', async () => {
    const event = { path: '/' };
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await helloWorld(event, context, callback);

    expect(result).toEqual({
      statusCode: 200,
      body: 'Hello World',
    });
  });

  it('returns 200 when no path is provided', async () => {
    const event = {}; // No path provided
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await helloWorld(event as any, context, callback);

    expect(result).toEqual({
      statusCode: 200,
      body: 'Hello World',
    });
  });

  it('returns 404 Not Found for an unknown path', async () => {
    const event = { path: '/unknown' };
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await helloWorld(event, context, callback);

    expect(result).toEqual({
      statusCode: 404,
      body: 'Not Found',
    });
  });
});
