// mock service
jest.mock('../../services/letter-operations');
import * as letterService from '../../services/letter-operations';
const mockedBatchUpdateStatus = jest.mocked(letterService.enqueueLetterUpdateRequests);

// mock mapper
jest.mock('../../mappers/error-mapper');
import { processError } from '../../mappers/error-mapper';
const mockedProcessError = jest.mocked(processError);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: 'Error'
};
mockedProcessError.mockReturnValue(expectedErrorResponse);

import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import { PostLettersRequest } from '../../contracts/letters';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';
import { S3Client } from '@aws-sdk/client-s3';
import pino from 'pino';
import { LetterRepository } from '@internal/datastore/src';
import { EnvVars } from '../../config/env';
import { Deps } from "../../config/deps";
import { createPostLettersHandler } from '../post-letters';

const updateLettersRequest : PostLettersRequest = {
  data: [
    {
      id: 'id1',
      type: 'Letter',
      attributes: {
        status: 'REJECTED',
        reasonCode: 123,
        reasonText: 'Reason text',
      }
    },
    {
      id: 'id2',
      type: 'Letter',
      attributes: {
        status: 'ACCEPTED'
      }
    },
    {
      id: 'id3',
      type: 'Letter',
      attributes: {
        status: 'DELIVERED'
      }
    },
  ]
};

const requestBody = JSON.stringify(updateLettersRequest, null, 2);

describe('postLetters API Handler', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockedDeps: jest.Mocked<Deps> = {
    s3Client: {} as unknown as S3Client,
    letterRepo: {} as unknown as LetterRepository,
    logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
      APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
      LETTERS_TABLE_NAME: 'LETTERS_TABLE_NAME',
      LETTER_TTL_HOURS: 12960,
      DOWNLOAD_URL_TTL_SECONDS: 60,
      MAX_LIMIT: 2500,
      QUEUE_URL: 'SQS_URL'
    } as unknown as EnvVars
  } as Deps;

  it('returns 202 Accepted', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      body: requestBody,
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    mockedBatchUpdateStatus.mockResolvedValue();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(result).toEqual({
      statusCode: 202,
      body: ''
    });
  });

  it('returns error when supplier id is missing', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      body: requestBody,
      headers: {
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(new Error('The supplier ID is missing from the request'), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if correlation id not provided in request', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      body: requestBody,
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined, mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when there is no body', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingBody), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error when request body does not have correct shape', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      body: "{test: 'test'}",
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestBody), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error when request contains more than 2500 letters to update', async () => {

    const event = makeApiGwEvent({
      path: '/letters',
      body: JSON.stringify({
        data : Array.from({ length: 2501 },
          () => ({
            id: 'id1',
            type: 'Letter',
            attributes: {
              status: 'ACCEPTED'
            }
          })
        )
      }),
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestLettersToUpdate, { args: [mockedDeps.env.MAX_LIMIT]}), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

    it('returns error when the request has duplicate letter ids', async () => {

    const event = makeApiGwEvent({
      path: '/letters',
      body: JSON.stringify({
        data: [
          {
            id: 'id1',
            type: 'Letter',
            attributes: {
              status: 'ACCEPTED'
            }
          },
          {
            id: 'id1',
            type: 'Letter',
            attributes: {
              status: 'ACCEPTED'
            }
          }
        ]
      }),
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestDuplicateLetterId), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error when request body is not json', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      body: '{#invalidJSON',
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestBody), 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error if unexpected error is thrown', async () => {
    const event = makeApiGwEvent({
      path: '/letters',
      body: 'somebody',
      headers: {
        'nhsd-supplier-id': 'supplier1',
        'nhsd-correlation-id': 'correlationId',
        'x-request-id': 'requestId'
      }
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const error = 'Unexpected error';
    const spy = jest.spyOn(JSON, 'parse').mockImplementation(() => {
      throw error;
    });

    const postLettersHandler = createPostLettersHandler(mockedDeps);
    const result = await postLettersHandler(event, context, callback);

    expect(mockedProcessError).toHaveBeenCalledWith(error, 'correlationId', mockedDeps.logger);
    expect(result).toEqual(expectedErrorResponse);

    spy.mockRestore();
  });
});
