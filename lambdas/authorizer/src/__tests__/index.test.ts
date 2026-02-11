import {
  APIGatewayEventClientCertificate,
  APIGatewayRequestAuthorizerEvent,
  Callback,
  Context,
} from "aws-lambda";
import pino from "pino";
import { Deps } from "../deps";
import { EnvVars } from "../env";
import createAuthorizerHandler from "../authorizer";

const mockedDeps: jest.Mocked<Deps> = {
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as pino.Logger,
  env: {
    CLOUDWATCH_NAMESPACE: "cloudwatch-namespace",
    CLIENT_CERTIFICATE_EXPIRATION_ALERT_DAYS: 14,
    APIM_SUPPLIER_ID_HEADER: "NHSD-Supplier-ID",
  } as unknown as EnvVars,
  supplierRepo: {
    getSupplierByApimId: jest.fn(),
  } as any,
} as Deps;

const buildCertWithExpiry = (
  expiry: string,
): APIGatewayEventClientCertificate => {
  return {
    subjectDN: "CN=test-subject",
    validity: {
      notAfter: expiry,
    } as APIGatewayEventClientCertificate["validity"],
  } as APIGatewayEventClientCertificate;
};

describe("Authorizer Lambda Function", () => {
  let mockEvent: APIGatewayRequestAuthorizerEvent;
  let mockContext: Context;
  let mockCallback: jest.MockedFunction<Callback>;

  beforeEach(() => {
    mockEvent = {
      type: "REQUEST",
      methodArn:
        "arn:aws:execute-api:region:account-id:api-id/stage/GET/resource",
      headers: {},
      pathParameters: {},
      requestContext: { identity: { clientCert: null } },
    } as APIGatewayRequestAuthorizerEvent;

    mockContext = {} as Context;
    mockCallback = jest.fn();
  });

  describe("Certificate expiry check", () => {
    beforeEach(() => {
      jest
        .useFakeTimers({ doNotFake: ["nextTick"] })
        .setSystemTime(new Date("2025-11-03T14:19:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("Should not log CloudWatch metric when certificate is null", async () => {
      mockEvent.requestContext.identity.clientCert = null;

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      const mockedInfo = mockedDeps.logger.info as jest.Mock;
      expect(mockedInfo.mock.calls).not.toContainEqual(
        expect.stringContaining("CloudWatchMetrics"),
      );
    });

    it("Should log CloudWatch metric when the certificate expiry threshold is reached", async () => {
      mockEvent.requestContext.identity.clientCert = buildCertWithExpiry(
        "2025-11-17T14:19:00Z",
      );

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      const mockedInfo = mockedDeps.logger.info as jest.Mock;
      expect(mockedInfo.mock.calls.map((call) => call[0])).toContain(
        JSON.stringify({
          _aws: {
            Timestamp: 1_762_179_540_000,
            CloudWatchMetrics: [
              {
                Namespace: "cloudwatch-namespace",
                Dimensions: ["SUBJECT_DN", "NOT_AFTER"],
                Metrics: [
                  {
                    Name: "apim-client-certificate-near-expiry",
                    Unit: "Count",
                    Value: 1,
                  },
                ],
              },
            ],
          },
          SUBJECT_DN: "CN=test-subject",
          NOT_AFTER: "2025-11-17T14:19:00Z",
          "apim-client-certificate-near-expiry": 1,
        }),
      );
    });

    it("Should not log CloudWatch metric when the certificate expiry threshold is not yet reached", async () => {
      mockEvent.requestContext.identity.clientCert = buildCertWithExpiry(
        "2025-11-18T14:19:00Z",
      );

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      const mockedInfo = mockedDeps.logger.info as jest.Mock;
      expect(mockedInfo.mock.calls).not.toContainEqual(
        expect.stringContaining("CloudWatchMetrics"),
      );
    });
  });

  describe("Supplier ID lookup", () => {
    it("Should deny the request when no headers are present", async () => {
      mockEvent.headers = null;

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockCallback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: "Deny",
              }),
            ],
          }),
        }),
      );
    });

    it("Should deny the request when the Supplier ID header is absent", async () => {
      mockEvent.headers = { "x-apim-correlation-id": "correlation-id" };

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockCallback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: "Deny",
              }),
            ],
          }),
        }),
      );
    });

    it("Should deny the request when no supplier ID is found", async () => {
      mockEvent.headers = { "NHSD-Supplier-ID": "unknown-apim-id" };
      (
        mockedDeps.supplierRepo.getSupplierByApimId as jest.Mock
      ).mockRejectedValue(new Error("Supplier not found"));

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockCallback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: "Deny",
              }),
            ],
          }),
        }),
      );
    });

    it("Should allow the request when the supplier ID is found", async () => {
      mockEvent.headers = { "NHSD-Supplier-ID": "valid-apim-id" };
      (
        mockedDeps.supplierRepo.getSupplierByApimId as jest.Mock
      ).mockResolvedValue({
        id: "supplier-123",
        apimApplicationId: "valid-apim-id",
        name: "Test Supplier",
        status: "ENABLED",
      });

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockCallback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: "Allow",
              }),
            ],
          }),
          principalId: "supplier-123",
        }),
      );
    });

    it("Should allow the request when the supplier ID key case mismatches", async () => {
      mockEvent.headers = { "nhsd-supplier-id": "Valid-Apim-Id" };
      (
        mockedDeps.supplierRepo.getSupplierByApimId as jest.Mock
      ).mockResolvedValue({
        id: "supplier-123",
        apimApplicationId: "valid-apim-id",
        name: "Test Supplier",
        status: "ENABLED",
      });

      const handler = createAuthorizerHandler(mockedDeps);
      handler(mockEvent, mockContext, mockCallback);
      await new Promise(process.nextTick);

      expect(mockCallback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          policyDocument: expect.objectContaining({
            Statement: [
              expect.objectContaining({
                Effect: "Allow",
              }),
            ],
          }),
          principalId: "supplier-123",
        }),
      );
    });
  });

  it("Should deny the request the supplier is disabled", async () => {
    mockEvent.headers = { "NHSD-Supplier-ID": "unknown-apim-id" };
    (
      mockedDeps.supplierRepo.getSupplierByApimId as jest.Mock
    ).mockResolvedValue({
      id: "supplier-123",
      apimApplicationId: "valid-apim-id",
      name: "Test Supplier",
      status: "DISABLED",
    });

    const handler = createAuthorizerHandler(mockedDeps);
    handler(mockEvent, mockContext, mockCallback);
    await new Promise(process.nextTick);

    expect(mockCallback).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        policyDocument: expect.objectContaining({
          Statement: [
            expect.objectContaining({
              Effect: "Deny",
            }),
          ],
        }),
      }),
    );
  });
});
