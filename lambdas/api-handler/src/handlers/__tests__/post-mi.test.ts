import { Context } from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import { makeApiGwEvent } from "./utils/test-utils";
import { PostMIRequest, PostMIResponse } from "../../contracts/mi";
import * as miService from '../../services/mi-operations';
import { postMi } from '../../index';

jest.mock('../../services/mi-operations');

jest.mock('../../config/lambda-config', () => ({
  lambdaConfig: {
    SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
    APIM_CORRELATION_HEADER: 'nhsd-correlation-id'
  }
}));

const postMiRequest : PostMIRequest = {
    data: {
      type: 'ManagementInformation',
      attributes: {
        lineItem: 'envelope-business-standard',
        timestamp: '2023-11-17T14:27:51.413Z',
        quantity: 22,
        specificationId: 'spec1',
        groupId: 'group1',
        stockRemaining: 20000
      }
    }
};
const requestBody = JSON.stringify(postMiRequest, null, 2);

    const postMiResponse : PostMIResponse = {
        data: {
          id: 'id1',
          ...postMiRequest.data
        }
    };

const mockedPostMiOperation = jest.mocked(miService.postMI);

beforeEach(() => {
  jest.clearAllMocks();
});


describe('postMI API Handler', () => {
  it('returns 200 OK with updated resource', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });

    mockedPostMiOperation.mockResolvedValue(postMiResponse);

    const result = await postMi(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual({
      statusCode: 201,
      body: JSON.stringify(postMiResponse, null, 2)
    });
  });


  it.each([['not a date string'], ['2025-10-16T00:00:00'], ['2025-16-10T00:00:00Z']])
    ('returns 400 Bad Request when the timestamp is not an ISO8601 instant', async (timestamp: string) => {
    const invalidRequest = JSON.parse(requestBody);
    invalidRequest['data']['attributes']['timestamp'] = timestamp;
    const event = makeApiGwEvent({
      path: '/mi',
      body: JSON.stringify(invalidRequest),
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });

    const result = await postMi(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 400
    }));
  });

  it('returns 400 Bad Request when there is no body', async () => {
      const event = makeApiGwEvent({
        path: '/mi',
        headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
      });

      const result = await postMi(event,  mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 400
      }));
    });


  it('returns 500 Internal Error when error is thrown by service', async () => {
      const event = makeApiGwEvent({
        path: '/mi',
        body: requestBody,
        pathParameters: {id: 'id1'},
        headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
      });
      mockedPostMiOperation.mockRejectedValue(new Error());

      const result = await postMi(event,  mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 500
      }));
    });

  it('returns 400 Bad Request when supplier id is missing', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
      headers: {'nhsd-correlation-id': 'correlationId'}
    });

    const result = await postMi(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 400
    }));
  });

  it('returns 500 Internal Server Error when correlation id is missing', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
        headers: {'nhsd-supplier-id': 'supplier1'}
    });

    const result = await postMi(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));
  });

  it('returns 400 Bad Request when request does not have correct shape', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: '{"test": "test"}',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });

    const result = await postMi(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 400
    }));
  });

  it('returns 400 Bad Request when request body is not json', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: '{#invalidJSON',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });

    const result = await postMi(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 400
    }));
  });

    it('returns 500 Internal Server Error when parsing fails', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const spy = jest.spyOn(JSON, 'parse').mockImplementation(() => {
      throw 'Unexpected error';
    })

    const result = await postMi(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));

    spy.mockRestore();
  });
});
