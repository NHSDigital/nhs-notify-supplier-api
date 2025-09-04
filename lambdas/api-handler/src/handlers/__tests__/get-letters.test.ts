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

    const mockedGetLetters = letterService.getLettersForSupplier as jest.Mock;
    mockedGetLetters.mockResolvedValue([
      {
        id: "l1",
        specificationId: "s1",
        status: "PENDING",
      },
      {
        id: "l2",
        specificationId: "s1",
        status: "PENDING",
      },
      {
        id: "l3",
        specificationId: "s1",
        status: "PENDING",
      },
    ]);

    const event = makeApiGwEvent({path: '/letters'});
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    const expected = {
      data: [
        {
          id: "l1",
          type: "Letter",
          attributes: { specificationId: "s1", status: "PENDING" },
        },
        {
          id: "l2",
          type: "Letter",
          attributes: { specificationId: "s1", status: "PENDING" },
        },
        {
          id: "l3",
          type: "Letter",
          attributes: { specificationId: "s1", status: "PENDING" },
        },
      ],
    };

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

  it('returns 400 for missing supplier ID', async () => {
    const event = makeApiGwEvent({ path: "/letters", headers: {} });
    const context = mockDeep<Context>();
    const callback = jest.fn();
    const result = await getLetters(event, context, callback);

    expect(result).toEqual({
      statusCode: 400,
      body: 'Bad Request: Missing supplier ID',
    });
  });
});
