import { Context } from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import { makeApiGwEvent } from "./utils/test-utils";
import { PostMIRequest, PostMIResponse } from "../../contracts/mi";
import * as miService from '../../services/mi-operations';
import pino from 'pino';
import { MIRepository } from "../../../../../internal/datastore/src";
import { Deps } from "../../config/deps";
import { EnvVars } from "../../config/env";
import { createPostMIHandler } from "../post-mi";

jest.mock('../../services/mi-operations');

const postMIRequest : PostMIRequest = {
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
const requestBody = JSON.stringify(postMIRequest, null, 2);

    const postMIResponse : PostMIResponse = {
        data: {
          id: 'id1',
          ...postMIRequest.data
        }
    };

const mockedPostMIOperation = jest.mocked(miService.postMI);

beforeEach(() => {
  jest.clearAllMocks();
});


describe('postMI API Handler', () => {

    const mockedDeps: jest.Mocked<Deps> = {
      miRepo: {} as unknown as MIRepository,
      logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
      env: {
        SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
        APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
        DOWNLOAD_URL_TTL_SECONDS: 1
      } as unknown as EnvVars
    } as Deps;


  it('returns 200 OK with updated resource', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    mockedPostMIOperation.mockResolvedValue(postMIResponse);

    const postMI = createPostMIHandler(mockedDeps);
    const result = await postMI(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual({
      statusCode: 201,
      body: JSON.stringify(postMIResponse, null, 2)
    });
  });


  it.each([['not a date string', false], ['2025-10-16T00:00:00', false], ['2025-16-10T00:00:00Z', false],
            ['2025-10-16T00:00:00Z', true], ['2025-10-16T00:00:00.000000Z', true]])
    ('validates the timestamp', async (timestamp: string, valid: boolean) => {
    const modifiedRequest = JSON.parse(requestBody);
    modifiedRequest['data']['attributes']['timestamp'] = timestamp;
    const event = makeApiGwEvent({
      path: '/mi',
      body: JSON.stringify(modifiedRequest),
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    const postMI = createPostMIHandler(mockedDeps);
    const result = await postMI(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: valid? 201: 400
    }));
  });

  it('returns 400 Bad Request when there is no body', async () => {
      const event = makeApiGwEvent({
        path: '/mi',
        headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
      });

      const postMI = createPostMIHandler(mockedDeps);
      const result = await postMI(event,  mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 400
      }));
    });


  it('returns 500 Internal Error when error is thrown by service', async () => {
      const event = makeApiGwEvent({
        path: '/mi',
        body: requestBody,
        pathParameters: {id: 'id1'},
        headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
      });
      mockedPostMIOperation.mockRejectedValue(new Error());

      const postMI = createPostMIHandler(mockedDeps);
      const result = await postMI(event,  mockDeep<Context>(), jest.fn());

      expect(result).toEqual(expect.objectContaining({
        statusCode: 500
      }));
    });

  it('returns 500 Bad Request when supplier id is missing', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
      headers: {'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    const postMI = createPostMIHandler(mockedDeps);
    const result = await postMI(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));
  });

  it('returns 500 Internal Server Error when correlation id is missing', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
        headers: {'nhsd-supplier-id': 'supplier1', 'x-request-id': 'requestId'}
    });

    const postMI = createPostMIHandler(mockedDeps);
    const result = await postMI(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));
  });

  it('returns 400 Bad Request when request does not have correct shape', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: '{"test": "test"}',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    const postMI = createPostMIHandler(mockedDeps);
    const result = await postMI(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 400
    }));
  });

  it('returns 400 Bad Request when request body is not json', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: '{#invalidJSON',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });

    const postMI = createPostMIHandler(mockedDeps);
    const result = await postMI(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 400
    }));
  });

    it('returns 500 Internal Server Error when parsing fails', async () => {
    const event = makeApiGwEvent({
      path: '/mi',
      body: requestBody,
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId', 'x-request-id': 'requestId'}
    });
    const spy = jest.spyOn(JSON, 'parse').mockImplementation(() => {
      throw 'Unexpected error';
    })

    const postMI = createPostMIHandler(mockedDeps);
    const result = await postMI(event,  mockDeep<Context>(), jest.fn());

    expect(result).toEqual(expect.objectContaining({
      statusCode: 500
    }));

    spy.mockRestore();
  });
});
