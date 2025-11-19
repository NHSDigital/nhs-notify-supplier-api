import { APIGatewayProxyEvent } from 'aws-lambda';
import { extractCommonIds } from '../commonIds';

const mockDeps = {
  env: {
    APIM_CORRELATION_HEADER: 'x-correlation-id',
    SUPPLIER_ID_HEADER: 'x-supplier-id',
  }
} as any;

const mockContext =  {} as APIGatewayProxyEvent['requestContext'];

describe('extractCommonIds', () => {
  it('returns error if headers are missing', () => {
    expect(extractCommonIds({}, mockContext, mockDeps)).toEqual({
      ok: false,
      error: expect.any(Error)
    });
  });

  it('returns error if correlation id is missing', () => {
    const headers = { 'x-supplier-id': 'SUP123', 'x-request-id': 'REQ123' };
    expect(extractCommonIds(headers, mockContext, mockDeps)).toEqual({
      ok: false,
      error: expect.any(Error)
    });
  });

  it('returns error if request id is missing', () => {
    const headers = { 'x-correlation-id': 'CORR123', 'x-supplier-id': 'SUP123' };
    expect(extractCommonIds(headers, mockContext, mockDeps)).toEqual({
      ok: false,
      error: expect.any(Error),
      correlationId: 'CORR123'
    });
  });

  it('returns error if supplier id is missing', () => {
    const headers = { 'x-correlation-id': 'CORR123', 'x-request-id': 'REQ123' };
    expect(extractCommonIds(headers, mockContext, mockDeps)).toEqual({
      ok: false,
      error: expect.any(Error),
      correlationId: 'CORR123'
    });
  });

  it('returns ok and ids if all present', () => {
    const headers = {
      'x-correlation-id': 'CORR123',
      'x-request-id': 'REQ123',
      'x-supplier-id': 'SUP123'
    };
    expect(extractCommonIds(headers, mockContext, mockDeps)).toEqual({
      ok: true,
      value: {
        correlationId: 'CORR123',
        supplierId: 'SUP123'
      }
    });
  });

  it('handles mixed case header names', () => {
    const headers = {
      'X-Correlation-Id': 'CORR123',
      'X-Request-Id': 'REQ123',
      'X-Supplier-Id': 'SUP123'
    };
    expect(extractCommonIds(headers, mockContext, mockDeps)).toEqual({
      ok: true,
      value: {
        correlationId: 'CORR123',
        supplierId: 'SUP123'
      }
    });
  });

  it('uses the supplier id from the authorizer if present', () => {
    const headers = { 'x-correlation-id': 'CORR123', 'x-supplier-id': 'SUP123', 'x-request-id': 'REQ123' };
    const context = { 'authorizer': {'principalId': 'SUP456'}} as unknown as APIGatewayProxyEvent['requestContext'];
    expect(extractCommonIds(headers, context, mockDeps)).toEqual({
      ok: true,
      value: {
        correlationId: 'CORR123',
        supplierId: 'SUP456'
      }
    });
  });

  it('refuses to use the supplier id from the header if authorizer is present', () => {
    const headers = { 'x-correlation-id': 'CORR123', 'x-supplier-id': 'SUP123', 'x-request-id': 'REQ123' };
    const context = { 'authorizer': {}} as unknown as APIGatewayProxyEvent['requestContext'];
    expect(extractCommonIds(headers, context, mockDeps)).toEqual({
      ok: false,
      error: expect.any(Error),
      correlationId: 'CORR123'
    });
  });
});
