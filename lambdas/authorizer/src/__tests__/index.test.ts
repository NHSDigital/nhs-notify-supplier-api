import { handler } from '../index';
import { APIGatewayRequestAuthorizerEvent, Context, Callback } from 'aws-lambda';

describe('Authorizer Lambda Function', () => {
  let mockEvent: APIGatewayRequestAuthorizerEvent;
  let mockContext: Context;
  let mockCallback: jest.MockedFunction<Callback<any>>;

  beforeEach(() => {
    mockEvent = {
      type: 'REQUEST',
      methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/GET/resource',
      headers: {},
      pathParameters: {}
    } as APIGatewayRequestAuthorizerEvent;

    mockContext = {} as Context;
    mockCallback = jest.fn();
  });

  it('Should allow access when headers match', () => {
    mockEvent.headers = { HeaderAuth1: 'headerValue1' };

    handler(mockEvent, mockContext, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
      policyDocument: expect.objectContaining({
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Allow',
          }),
        ]),
      }),
    }));
  });

  it('Should deny access when headers do not match', () => {
    mockEvent.headers = { HeaderAuth1: 'wrongValue' };

    handler(mockEvent, mockContext, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
      policyDocument: expect.objectContaining({
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Deny',
          }),
        ]),
      }),
    }));
  });

  it('Should handle null headers gracefully', () => {
    mockEvent.headers = null;

    handler(mockEvent, mockContext, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
      policyDocument: expect.objectContaining({
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Deny',
          }),
        ]),
      }),
    }));
  });

  it('Should handle defined headers correctly', () => {
    mockEvent.headers = { HeaderAuth1: 'headerValue1' };

    handler(mockEvent, mockContext, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
      policyDocument: expect.objectContaining({
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Allow',
          }),
        ]),
      }),
    }));
  });
});
