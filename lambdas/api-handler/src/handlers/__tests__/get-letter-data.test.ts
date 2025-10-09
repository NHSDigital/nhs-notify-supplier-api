import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { mockDeep } from 'jest-mock-extended';
import { makeApiGwEvent } from './utils/test-utils';
import * as letterService from '../../services/letter-operations';
import { mapErrorToResponse } from '../../mappers/error-mapper';
import { ValidationError } from '../../errors';
import * as errors from '../../contracts/errors';
import { getLetterData } from '../get-letter-data';

jest.mock('../../mappers/error-mapper');
const mockedMapErrorToResponse = jest.mocked(mapErrorToResponse);
const expectedErrorResponse: APIGatewayProxyResult = {
  statusCode: 400,
  body: 'Error'
};
mockedMapErrorToResponse.mockReturnValue(expectedErrorResponse);

jest.mock('../../services/letter-operations');

jest.mock('../../config/lambda-config', () => ({
  lambdaConfig: {
    SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
    APIM_CORRELATION_HEADER: 'nhsd-correlation-id'
  }
}));

describe('API Lambda handler', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns 303 Found with a pre signed url', async () => {

    const mockedGetLetterDataUrlService = letterService.getLetterDataUrl as jest.Mock;
    mockedGetLetterDataUrlService.mockResolvedValue('https://somePreSignedUrl.com');

    const event = makeApiGwEvent({path: '/letters/letter1/data',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'},
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(result).toEqual({
      statusCode: 303,
      headers: {
        'Location': 'https://somePreSignedUrl.com',
      },
      body: ''
    });
  });

  it('returns 400 for missing supplier ID (empty headers)', async () => {
    const event = makeApiGwEvent({ path: '/letters/letter1/data', headers: {},
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error('The request headers are empty'), undefined);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns 500 if correlation id not provided in request', async () => {
    const event = makeApiGwEvent({
      path: '/letters/letter1/data',
      queryStringParameters: { limit: '2000' },
      headers: {'nhsd-supplier-id': 'supplier1'},
      pathParameters: {id: 'id1'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new Error("The request headers don't contain the APIM correlation id"), undefined);
    expect(result).toEqual(expectedErrorResponse);
  });

  it('returns error response when path parameter letterId is not found', async () => {
    const event = makeApiGwEvent({
      path: '/letters/',
      headers: {'nhsd-supplier-id': 'supplier1', 'nhsd-correlation-id': 'correlationId'}
    });
    const context = mockDeep<Context>();
    const callback = jest.fn();

    const result = await getLetterData(event, context, callback);

    expect(mockedMapErrorToResponse).toHaveBeenCalledWith(new ValidationError(errors.ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter), 'correlationId');
    expect(result).toEqual(expectedErrorResponse);
  });
});
