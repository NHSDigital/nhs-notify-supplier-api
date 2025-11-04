import { APIGatewayEventClientCertificate, APIGatewayRequestAuthorizerEvent, Callback, Context } from 'aws-lambda';
import { Deps } from '../deps';
import pino from 'pino';
import { EnvVars } from '../env';
import { createAuthorizerHandler } from '../authorizer';

const mockedDeps: jest.Mocked<Deps> = {
    logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      CLOUDWATCH_NAMESPACE: 'cloudwatch-namespace',
      CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS: 14,
      APIM_APPLICATION_ID_HEADER: 'apim-application-id'
    } as unknown as EnvVars,
    cloudWatchClient: {
      send: jest.fn().mockResolvedValue({}),
    } as any,
    supplierRepo: {
      getSupplierByApimId: jest.fn(),
    } as any,
  } as Deps;


describe('Authorizer Lambda Function', () => {
  let mockEvent: APIGatewayRequestAuthorizerEvent;
  let mockContext: Context;
  let mockCallback: jest.MockedFunction<Callback<any>>;

  beforeEach(() => {
    mockEvent = {
      type: 'REQUEST',
      methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/GET/resource',
      headers: {},
      pathParameters: {},
      requestContext: {identity: {clientCert: null}},
    } as APIGatewayRequestAuthorizerEvent;

    mockContext = {} as Context;
    mockCallback = jest.fn();
  });

  describe('Certificate expiry check', () => {

    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] })
        .setSystemTime(new Date('2025-11-03T14:19:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    })

    it('Should not send CloudWatch metric when certificate is null', async () => {
      mockEvent.requestContext.identity.clientCert = null;

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockedDeps.cloudWatchClient.send).not.toHaveBeenCalled();
    });

    it('Should send CloudWatch metric when the certificate expiry threshold is reached', async () => {
      mockEvent.requestContext.identity.clientCert = buildCertWithExpiry('2025-11-17T14:19:00Z');

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockedDeps.cloudWatchClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Namespace: 'cloudwatch-namespace',
            MetricData: [
              {
                MetricName: 'apim-client-certificate-near-expiry',
                Dimensions: [
                  { Name: 'SUBJECT_DN', Value: 'CN=test-subject' },
                  { Name: 'NOT_AFTER', Value: '2025-11-17T14:19:00Z' },
                ],
              },
            ],
          },
        })
      );
    });

    it('Should not send CloudWatch metric when the certificate expiry threshold is not yet reached', async () => {
      mockEvent.requestContext.identity.clientCert = buildCertWithExpiry('2025-11-18T14:19:00Z');

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockedDeps.cloudWatchClient.send).not.toHaveBeenCalled();
    });
  });

  function buildCertWithExpiry(expiry: string): APIGatewayEventClientCertificate {

    return {
      subjectDN: 'CN=test-subject',
      validity: {
        notAfter: expiry,
      } as APIGatewayEventClientCertificate['validity'],
    } as APIGatewayEventClientCertificate;
  }

    describe('Supplier ID lookup', () => {

      it('Should deny the request when no headers are present', async () => {
        mockEvent.headers = null;

        const handler = createAuthorizerHandler(mockedDeps);
        handler(mockEvent, mockContext, mockCallback);
        await new Promise(process.nextTick);

        expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: 'Deny',
              }),
            ],
          }),
        }));
      });

      it('Should deny the request when the APIM application ID header is absent', async () => {
        mockEvent.headers = {'x-apim-correlation-id': 'correlation-id'};

        const handler = createAuthorizerHandler(mockedDeps);
        handler(mockEvent, mockContext, mockCallback);
        await new Promise(process.nextTick);

        expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: 'Deny',
              }),
            ],
          }),
        }));
      });

      it('Should deny the request when no supplier ID is found', async () => {
        mockEvent.headers = { 'apim-application-id': 'unknown-apim-id' };
        (mockedDeps.supplierRepo.getSupplierByApimId as jest.Mock).mockRejectedValue(new Error('Supplier not found'));

        const handler = createAuthorizerHandler(mockedDeps);
        handler(mockEvent, mockContext, mockCallback);
        await new Promise(process.nextTick);

        expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: 'Deny',
              }),
            ],
          }),
        }));
      });

      it('Should allow the request when the supplier ID is found', async () => {
        mockEvent.headers = { 'apim-application-id': 'valid-apim-id' };
        (mockedDeps.supplierRepo.getSupplierByApimId as jest.Mock).mockResolvedValue({
          id: 'supplier-123',
          apimApplicationId: 'valid-apim-id',
          name: 'Test Supplier',
        });

        const handler = createAuthorizerHandler(mockedDeps);
        handler(mockEvent, mockContext, mockCallback);
        await new Promise(process.nextTick);

        expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: 'Allow',
              }),
            ],
          }),
          context: {
            supplierId: 'supplier-123',
          },
        }));
      });
    });
});
